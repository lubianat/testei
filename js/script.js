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
    const answerKey = `answers/${testSelect}_answers.json`;

    if (testSelect) {
        pdfFrame.src = `pdfs/${testSelect}.pdf`;
        // Carregar o gabarito e gerar dinamicamente as questões
        fetch(answerKey)
            .then(response => response.json())
            .then(data => {
                window.correctAnswers = data;
                generateScoreCard(data);
            });
    }
}

// Função para gerar dinamicamente o cartão de respostas baseado no número de perguntas
function generateScoreCard(answers) {
    const form = document.getElementById('questions-form');
    form.innerHTML = ''; // Limpar quaisquer questões existentes
    userAnswers = {}; // Reset user answers for new test

    // Percorrer as chaves do JSON para criar as questões dinamicamente
    Object.keys(answers).forEach((questionKey, index) => {
        const questionNumber = index + 1;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');

        // Criar o rótulo da pergunta
        const questionLabel = document.createElement('label');
        questionLabel.innerText = `Questão ${questionNumber}.`;
        questionDiv.appendChild(questionLabel);
        questionDiv.appendChild(document.createElement('br'));

        // Criar os botões de rádio para opções de A a E
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

        // Adicionar um span para mostrar o resultado (certo/errado)
        const resultSpan = document.createElement('span');
        resultSpan.id = `result-${questionKey}`; // ID exclusivo para cada resultado
        questionDiv.appendChild(resultSpan);

        form.appendChild(questionDiv);
    });
}

// Função para calcular a pontuação com base nas respostas selecionadas
function calculateScore() {
    const form = document.getElementById('questions-form');
    let score = 0;

    // Percorrer as respostas armazenadas e comparar com as entradas do usuário
    Object.keys(window.correctAnswers).forEach((questionKey) => {
        const selectedAnswer = form[questionKey].value;
        userAnswers[questionKey] = selectedAnswer; // Armazena a resposta do usuário
        const resultSpan = document.getElementById(`result-${questionKey}`); // Pega o span de resultado

        // Verifica se está correto ou não e exibe a resposta certa
        if (selectedAnswer === window.correctAnswers[questionKey]) {
            score++;
            resultSpan.innerHTML = ` ✅ (<span style="color: green">${window.correctAnswers[questionKey]}</span>)`;
        } else {
            resultSpan.innerHTML = ` ❌ (<span style="color: red">${window.correctAnswers[questionKey]}</span>)`;
        }
    });

    const scoreOutput = document.getElementById('score-output');
    scoreOutput.innerHTML = `Seu resultado foi ${score}/${Object.keys(window.correctAnswers).length}`;
}

// Função para baixar o resultado em formato PDF usando jsPDF
// Função para baixar o resultado em formato PDF usando jsPDF com AutoTable
function downloadScore() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Define the table headers
    const headers = [['Questão', 'Sua Resposta', 'Resposta Correta', 'Status']];

    // Populate the table rows with user answers and correct answers
    const data = Object.keys(window.correctAnswers).map((questionKey, index) => {
        const userAnswer = userAnswers[questionKey] || "Não respondida";
        const correctAnswer = window.correctAnswers[questionKey];
        const status = userAnswer === correctAnswer ? "ok" : "X";
        return [`Questão ${index + 1}`, userAnswer, correctAnswer, status];
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

