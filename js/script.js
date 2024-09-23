let timerInterval;
let timerVisible = true;
let isPaused = false;
let totalSeconds = 0;

// Função para iniciar o Timer
function startTimer() {
    const timerElement = document.getElementById('timer');

    if (isPaused) {
        isPaused = false;
        return;
    }

    timerElement.style.display = 'block'; // Certifique-se de que o timer está visível
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (!isPaused) {
            totalSeconds++;
            const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
            const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
            const secs = (totalSeconds % 60).toString().padStart(2, '0');
            timerElement.innerHTML = `${hrs}:${mins}:${secs}`;
        }
    }, 1000);
}

// Função para pausar o Timer
function pauseTimer() {
    isPaused = true;
}

// Função para resetar o Timer
function resetTimer() {
    clearInterval(timerInterval);
    totalSeconds = 0;
    isPaused = false;
    document.getElementById('timer').innerHTML = '00:00:00';
}

// Alternar a visibilidade do Timer
function toggleTimer() {
    const timerElement = document.getElementById('timer');
    if (timerVisible) {
        timerElement.style.display = 'none';
        document.getElementById('toggle-timer').innerText = 'Mostrar Timer';
    } else {
        timerElement.style.display = 'block';
        document.getElementById('toggle-timer').innerText = 'Ocultar Timer';
    }
    timerVisible = !timerVisible;
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
        const resultSpan = document.getElementById(`result-${questionKey}`); // Pega o span de resultado

        if (selectedAnswer === window.correctAnswers[questionKey]) {
            score++;
            resultSpan.innerHTML = ' ✅'; // Mostra o "ok" verde
            resultSpan.style.color = 'green';
        } else {
            resultSpan.innerHTML = ' ❌'; // Mostra o "errado" vermelho
            resultSpan.style.color = 'red';
        }
    });

    const scoreOutput = document.getElementById('score-output');
    scoreOutput.innerHTML = `Seu resultado foi ${score}/${Object.keys(window.correctAnswers).length}`;
}
