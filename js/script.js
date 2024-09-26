let timerInterval;
let totalSeconds = 0;
let isPaused = true;
let isTimerBarVisible = false; // Track timer bar visibility

// Função para iniciar/pausar o Timer
function togglePlayPause() {
    const playPauseIcon = document.getElementById("play-pause-icon");
    if (isPaused) {
        startTimer();
        playPauseIcon.classList.remove("fa-play");
        playPauseIcon.classList.add("fa-pause");
    } else {
        pauseTimer();
        playPauseIcon.classList.remove("fa-pause");
        playPauseIcon.classList.add("fa-play");
    }
}

// Função para iniciar o Timer
function startTimer() {
    isPaused = false;
    timerInterval = setInterval(() => {
        totalSeconds++;
        document.getElementById("timer-display").textContent = formatTime(totalSeconds);
    }, 1000);
}

// Função para pausar o Timer
function pauseTimer() {
    clearInterval(timerInterval);
    isPaused = true;
}

// Função para resetar o Timer
function resetTimer() {
    clearInterval(timerInterval);
    totalSeconds = 0;
    document.getElementById("timer-display").textContent = "00:00:00";
    isPaused = true;
    const playPauseIcon = document.getElementById("play-pause-icon");
    playPauseIcon.classList.remove("fa-pause");
    playPauseIcon.classList.add("fa-play");
}

// Formatar tempo no estilo hh:mm:ss
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
}

// Função para alternar a visibilidade da barra de timer
function toggleTimerBar() {
    const timerBar = document.getElementById("timer-bar");
    isTimerBarVisible = !isTimerBarVisible;
    timerBar.style.display = isTimerBarVisible ? "flex" : "none";
}


// Função para confirmar a troca da prova apenas se houver respostas
function confirmLoadTest() {
    const form = document.getElementById('questions-form');
    const answeredQuestions = Object.values(form).some(input => input.checked);

    if (answeredQuestions) {
        const confirmChange = confirm('Tem certeza que deseja carregar essa prova? Suas respostas atuais serão descartadas.');
        if (confirmChange) {
            loadTest();
        }
    } else {
        loadTest(); // Carrega a prova imediatamente se nenhuma resposta foi dada
    }
}

// Função para carregar o teste selecionado
function loadTest() {
    const testSelect = document.getElementById('test').value;
    const pdfFrame = document.getElementById('pdf-frame');
    const answerKey = `answers/${testSelect}.json`;

    if (testSelect) {
        pdfFrame.src = `pdfs/${testSelect}.pdf`;
        // Carregar o gabarito e gerar dinamicamente as questões
        fetch(answerKey)
            .then(response => response.json())
            .then(data => {
                window.correctAnswers = data.answers; // Access the 'answers' object inside the JSON
                generateScoreCard(data.answers); // Pass only the answers to generate the score card
            });
    }
}
// Helper function to get sorted entries from the answers object
function getSortedEntries(answers) {
    // Detect if the answers have an 'order' field
    const isOrdered = typeof Object.values(answers)[0] === 'object' && 'order' in Object.values(answers)[0];

    let sortedEntries;

    if (isOrdered) {
        // Sort based on the 'order' field
        sortedEntries = Object.entries(answers).sort((a, b) => a[1].order - b[1].order);
    } else {
        // No 'order' field; sort based on the keys (numerical part)
        sortedEntries = Object.entries(answers).sort((a, b) => {
            const [numA] = a[0].split('-');
            const [numB] = b[0].split('-');
            return parseInt(numA) - parseInt(numB);
        });
    }

    return sortedEntries;
}


// Função para gerar dinamicamente o cartão de respostas baseado no número de perguntas
function generateScoreCard(answers) {
    const form = document.getElementById('questions-form');
    form.innerHTML = ''; // Clear any existing questions
    userAnswers = {}; // Reset user answers for the new test

    // Get sorted entries from answers
    const sortedEntries = getSortedEntries(answers);

    // Iterate over sorted entries and generate the scorecard
    sortedEntries.forEach(([questionKey, data]) => {
        const answer = typeof data === 'object' ? data.answer : data; // Get the answer (either a string or from the object)
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');

        // Create the label for the question
        const questionLabel = document.createElement('label');
        questionLabel.innerText = `Questão ${questionKey}.`;
        questionDiv.appendChild(questionLabel);
        questionDiv.appendChild(document.createElement('br'));

        // Create radio buttons for options A to E
        ['A', 'B', 'C', 'D', 'E'].forEach(option => {
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = questionKey;
            radio.value = option;

            const label = document.createElement('label');
            label.innerText = ` ${option} `;

            questionDiv.appendChild(radio);
            questionDiv.appendChild(label);
        });

        // Add a span to show correct/incorrect result
        const resultSpan = document.createElement('span');
        resultSpan.id = `result-${questionKey}`; // Unique ID for each result
        questionDiv.appendChild(resultSpan);

        form.appendChild(questionDiv);
    });
}



// Função para calcular a pontuação com base nas respostas selecionadas
function calculateScore() {
    const form = document.getElementById('questions-form');
    let score = 0;

    // Iterate over the correct answers and compare them with user's selections
    Object.keys(window.correctAnswers).forEach((questionKey) => {
        // Use querySelector to get the selected radio input based on the question's name
        const selectedRadio = form.querySelector(`input[name="${CSS.escape(questionKey)}"]:checked`);
        const selectedAnswer = selectedRadio ? selectedRadio.value : null; // Get the selected value or null if none

        userAnswers[questionKey] = selectedAnswer; // Store user's answer
        const resultSpan = document.getElementById(`result-${questionKey}`); // Get the result span

        // Determine the correct answer format (string or object)
        const correctAnswer = typeof window.correctAnswers[questionKey] === 'object'
            ? window.correctAnswers[questionKey].answer  // For ordered format (object)
            : window.correctAnswers[questionKey];        // For barebones format (string)

        // Check if the answer is correct and display the result
        if (selectedAnswer === correctAnswer) {
            score++;
            resultSpan.innerHTML = ` ✅ (<span style="color: green">${correctAnswer}</span>)`;
        } else {
            resultSpan.innerHTML = ` ❌ (<span style="color: red">${correctAnswer}</span>)`;
        }
    });

    const scoreOutput = document.getElementById('score-output');
    scoreOutput.innerHTML = `Seu resultado foi ${score}/${Object.keys(window.correctAnswers).length}`;
}


// Função para baixar o resultado em formato PDF usando jsPDF com AutoTable
function downloadScore() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Define the table headers
    const headers = [['Questão', 'Sua Resposta', 'Resposta Correta', 'Status']];

    // Get sorted entries from answers
    const sortedEntries = getSortedEntries(window.correctAnswers);

    // Populate the table rows with user answers and correct answers
    const data = sortedEntries.map(([questionKey, data]) => {
        const correctAnswer = typeof data === 'object' ? data.answer : data; // Get the correct answer
        const userAnswer = userAnswers[questionKey] || "Não respondida"; // Handle unanswered questions
        const status = userAnswer === correctAnswer ? "ok" : "X";
        return [`Questão ${questionKey}`, userAnswer, correctAnswer, status];
    });

    // Generate the AutoTable with the data
    doc.autoTable({
        head: headers,
        body: data,
        startY: 10, // Starting point for the table
        theme: 'grid', // You can use 'striped', 'grid', or 'plain'
        styles: {
            fontSize: 10,
        },
        headStyles: {
            fillColor: [41, 128, 185], // Blue header
        },
        bodyStyles: {
            halign: 'center', // Center align the text
        },
    });

    // Download the PDF
    doc.save('resultado_teste.pdf');
}



let isFormDirty = false; // Track if the form has been modified

// Add event listeners to the radio buttons to detect user input
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('questions-form');

    form.addEventListener('change', function () {
        isFormDirty = true; // Set the form as dirty when the user makes any change
    });

    // Warn the user before they leave the page if there are unsaved changes
    window.addEventListener('beforeunload', function (event) {
        if (isFormDirty) {
            // The confirmation dialog will only show if you assign a return value or preventDefault.
            event.preventDefault();
            event.returnValue = ''; // Some browsers require a return value, but it's ignored
            return ''; // Return a string or empty string, which will trigger the alert
        }
    });
});
