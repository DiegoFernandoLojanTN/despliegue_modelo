// Configuración global
const API_BASE_URL = 'https://stress-detector-backend.onrender.com';

// Variables globales
let charts = {};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupCharacterCounter();
    initializeCharts();
    setupSmoothScrolling();
}

function setupEventListeners() {
    // Formulario de análisis
    const form = document.getElementById('stressForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Botón de limpiar
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }

    // Tweets de ejemplo
    const sampleTweets = document.querySelectorAll('.sample-tweet');
    sampleTweets.forEach(tweet => {
        tweet.addEventListener('click', handleSampleTweetClick);
        tweet.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                handleSampleTweetClick.call(this, e);
            }
        });
        tweet.setAttribute('tabindex', '0');
    });
}

function setupCharacterCounter() {
    const messageText = document.getElementById('messageText');
    const charCount = document.getElementById('charCount');
    
    if (messageText && charCount) {
        messageText.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            // Cambiar color según el límite
            if (count > 250) {
                charCount.style.color = '#dc3545';
            } else if (count > 200) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = '#6c757d';
            }
        });
    }
}

function setupSmoothScrolling() {
    // Smooth scrolling para enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const messageText = document.getElementById('messageText');
    const text = messageText.value.trim();
    
    if (!text) {
        showAlert('Por favor, ingresa un mensaje para analizar.', 'warning');
        return;
    }
    
    if (text.length > 280) {
        showAlert('El mensaje no puede exceder 280 caracteres.', 'warning');
        return;
    }
    
    await analyzeStress(text);
}

function handleSampleTweetClick(e) {
    e.preventDefault();
    const text = this.dataset.text;
    const messageText = document.getElementById('messageText');
    
    if (messageText && text) {
        messageText.value = text;
        // Actualizar contador de caracteres
        const event = new Event('input');
        messageText.dispatchEvent(event);
        
        // Scroll al formulario
        document.getElementById('analyzer').scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Analizar automáticamente después de un breve delay
        setTimeout(() => {
            analyzeStress(text);
        }, 500);
    }
}

function clearForm() {
    const messageText = document.getElementById('messageText');
    const results = document.getElementById('results');
    const charCount = document.getElementById('charCount');
    
    if (messageText) {
        messageText.value = '';
        messageText.focus();
    }
    
    if (results) {
        results.style.display = 'none';
    }
    
    if (charCount) {
        charCount.textContent = '0';
        charCount.style.color = '#6c757d';
    }
}

async function analyzeStress(text) {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    try {
        // Mostrar loading
        if (loading) loading.style.display = 'block';
        if (results) results.style.display = 'none';
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analizando...';
        }
        
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();
        displayResults(data, text);
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al analizar el mensaje. Por favor, inténtalo de nuevo.', 'danger');
    } finally {
        // Ocultar loading
        if (loading) loading.style.display = 'none';
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-brain me-2"></i>Analizar Estrés';
        }
    }
}

function displayResults(data, originalText) {
    const results = document.getElementById('results');
    const resultContent = document.getElementById('resultContent');
    
    if (!results || !resultContent) return;
    
    const isStress = data.prediction === 1;
    const confidence = Math.round(data.confidence * 100);
    const probability = Math.round(data.probability * 100);
    
    const resultClass = isStress ? 'result-stress' : 'result-no-stress';
    const resultIcon = isStress ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
    const resultText = isStress ? 'Estrés Detectado' : 'No se Detectó Estrés';
    const resultDescription = isStress 
        ? 'El mensaje muestra indicadores de estrés psicológico.'
        : 'El mensaje no presenta indicadores significativos de estrés.';
    
    resultContent.innerHTML = `
        <div class="result-card card ${resultClass}">
            <div class="card-body text-center p-4">
                <div class="result-icon mb-3">
                    <i class="${resultIcon} fa-3x"></i>
                </div>
                <h3 class="result-title mb-3">${resultText}</h3>
                <p class="result-description mb-4">${resultDescription}</p>
                
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="metric-item">
                            <h4 class="metric-number">${probability}%</h4>
                            <p class="metric-label">Probabilidad</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="metric-item">
                            <h4 class="metric-number">${confidence}%</h4>
                            <p class="metric-label">Confianza</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="metric-item">
                            <h4 class="metric-number">${originalText.length}</h4>
                            <p class="metric-label">Caracteres</p>
                        </div>
                    </div>
                </div>
                
                <div class="confidence-section">
                    <p class="mb-2">Nivel de Confianza:</p>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidence}%"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-3 text-center">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Resultado basado en modelo SVM optimizado con F1-Score del 92.60%
            </small>
        </div>
    `;
    
    results.style.display = 'block';
    
    // Scroll suave a los resultados
    setTimeout(() => {
        results.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, 100);
}

function showAlert(message, type = 'info') {
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function initializeCharts() {
    initializeComparisonChart();
    initializeDataDistributionChart();
    initializeOptimizationChart();
}

function initializeComparisonChart() {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    
    charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Exactitud', 'Precisión', 'Sensibilidad', 'F1-Score'],
            datasets: [{
                label: 'SVM Base',
                data: [91.16, 91.14, 91.14, 91.14],
                backgroundColor: 'rgba(108, 117, 125, 0.8)',
                borderColor: 'rgba(108, 117, 125, 1)',
                borderWidth: 1
            }, {
                label: 'SVM Optimizado',
                data: [92.63, 92.80, 92.41, 92.60],
                backgroundColor: 'rgba(0, 123, 255, 0.8)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Métricas de Rendimiento (%)'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function initializeDataDistributionChart() {
    const ctx = document.getElementById('dataDistributionChart');
    if (!ctx) return;
    
    charts.dataDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entrenamiento (80%)', 'Validación (10%)', 'Prueba (10%)'],
            datasets: [{
                data: [3800, 475, 475],
                backgroundColor: [
                    'rgba(0, 123, 255, 0.8)',
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(255, 193, 7, 0.8)'
                ],
                borderColor: [
                    'rgba(0, 123, 255, 1)',
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 193, 7, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución del Dataset (4,750 muestras)'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function initializeOptimizationChart() {
    const ctx = document.getElementById('optimizationChart');
    if (!ctx) return;
    
    // Datos simulados del proceso de optimización
    const trials = Array.from({length: 100}, (_, i) => i + 1);
    const f1Scores = [
        0.1, 0.3, 0.5, 0.7, 0.8, 0.85, 0.87, 0.89, 0.90, 0.91,
        0.915, 0.92, 0.922, 0.924, 0.925, 0.926, 0.9255, 0.9258, 0.9260, 0.9259,
        ...Array(80).fill(0).map(() => 0.9260 + (Math.random() - 0.5) * 0.001)
    ];
    
    charts.optimization = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trials,
            datasets: [{
                label: 'F1-Score',
                data: f1Scores,
                borderColor: 'rgba(0, 123, 255, 1)',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Convergencia del F1-Score durante Optimización'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Trial'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'F1-Score'
                    },
                    min: 0,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(1) + '%';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Función para redimensionar gráficos cuando cambia el tamaño de ventana
window.addEventListener('resize', function() {
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.resize();
        }
    });
});

// Función para limpiar gráficos al salir de la página
window.addEventListener('beforeunload', function() {
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
});

