// Main JavaScript for Stress Detector App

const BACKEND_URL = "YOUR_BACKEND_URL_HERE"; // TO BE REPLACED WITH ACTUAL DEPLOYED BACKEND URL

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Get DOM elements
    const messageText = document.getElementById('messageText');
    const stressForm = document.getElementById('stressForm');
    const clearBtn = document.getElementById('clearBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const charCount = document.getElementById('charCount');
    const results = document.getElementById('results');
    const loading = document.getElementById('loading');
    const sampleTweets = document.querySelectorAll('.sample-tweet');

    // Character counter
    if (messageText && charCount) {
        messageText.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            // Change color based on character count
            if (count > 250) {
                charCount.style.color = '#dc3545';
            } else if (count > 200) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = '#6c757d';
            }
        });
    }

    // Form submission
    if (stressForm) {
        stressForm.addEventListener('submit', function(e) {
            e.preventDefault();
            analyzeStress();
        });
    }

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearForm();
        });
    }

    // Sample tweets click handlers
    sampleTweets.forEach(tweet => {
        tweet.addEventListener('click', function() {
            const text = this.getAttribute('data-text');
            const expected = this.getAttribute('data-expected');
            
            // Remove previous selections
            sampleTweets.forEach(t => t.classList.remove('selected'));
            
            // Add selection to clicked tweet
            this.classList.add('selected');
            
            // Fill the textarea
            if (messageText) {
                messageText.value = text;
                messageText.dispatchEvent(new Event('input'));
            }
            
            // Show expected result
            showExpectedResult(expected);
        });
    });

    // Add smooth scrolling to anchor links
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

function analyzeStress() {
    const messageText = document.getElementById('messageText');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');

    if (!messageText || !messageText.value.trim()) {
        showAlert('Por favor, ingresa un mensaje para analizar.', 'warning');
        return;
    }

    // Show loading state
    showLoading(true);
    analyzeBtn.disabled = true;
    
    // Prepare data
    const data = {
        text: messageText.value.trim()
    };

    // Make API request
    fetch(BACKEND_URL + '/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        analyzeBtn.disabled = false;
        
        if (data.success) {
            displayResults(data);
        } else {
            showAlert('Error: ' + (data.error || 'Error desconocido'), 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showLoading(false);
        analyzeBtn.disabled = false;
        showAlert('Error de conexión. Por favor, intenta nuevamente.', 'danger');
    });
}

function displayResults(data) {
    const results = document.getElementById('results');
    const resultContent = document.getElementById('resultContent');
    
    if (!results || !resultContent) return;

    const isStress = data.prediction === 'Estrés';
    const confidence = Math.round(data.confidence * 100);
    const probability = Math.round(data.probability * 100);

    const resultHTML = `
        <div class="result-card card ${isStress ? 'result-stress' : 'result-no-stress'} mb-4">
            <div class="card-body text-center">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <i class="fas ${isStress ? 'fa-exclamation-triangle' : 'fa-check-circle'} fa-4x mb-3"></i>
                        <h3 class="fw-bold">${data.prediction}</h3>
                    </div>
                    <div class="col-md-8">
                        <div class="row">
                            <div class="col-6">
                                <h5>Probabilidad</h5>
                                <div class="progress mb-2" style="height: 25px;">
                                    <div class="progress-bar ${isStress ? 'bg-warning' : 'bg-light'}" 
                                         role="progressbar" 
                                         style="width: ${probability}%; color: ${isStress ? '#000' : '#000'}"
                                         aria-valuenow="${probability}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                        ${probability}%
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <h5>Confianza</h5>
                                <div class="progress mb-2" style="height: 25px;">
                                    <div class="progress-bar ${confidence > 70 ? 'bg-success' : confidence > 40 ? 'bg-warning' : 'bg-danger'}" 
                                         role="progressbar" 
                                         style="width: ${confidence}%;"
                                         aria-valuenow="${confidence}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                        ${confidence}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h6 class="mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    Detalles del Análisis
                </h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Texto procesado:</strong></p>
                        <p class="text-muted small">${data.cleaned_text || 'No disponible'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Interpretación:</strong></p>
                        <p class="small">
                            ${getInterpretation(isStress, confidence)}
                        </p>
                        <p class="small text-muted">
                            <i class="fas fa-clock me-1"></i>
                            Análisis realizado: ${new Date(data.timestamp).toLocaleString('es-ES')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultContent.innerHTML = resultHTML;
    results.style.display = 'block';
    
    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Add animation
    results.classList.add('fade-in');
}

function getInterpretation(isStress, confidence) {
    if (isStress) {
        if (confidence > 70) {
            return 'El mensaje muestra claros indicadores de estrés. Se detectaron patrones lingüísticos asociados con estados de tensión o malestar.';
        } else if (confidence > 40) {
            return 'El mensaje presenta algunos indicadores de estrés, aunque con menor certeza. Podría contener elementos de tensión moderada.';
        } else {
            return 'Se detectaron posibles indicadores de estrés, pero con baja confianza. El resultado debe interpretarse con cautela.';
        }
    } else {
        if (confidence > 70) {
            return 'El mensaje no presenta indicadores significativos de estrés. El contenido parece neutral o positivo.';
        } else if (confidence > 40) {
            return 'El mensaje probablemente no contiene estrés, aunque algunos elementos podrían ser ambiguos.';
        } else {
            return 'No se detectaron indicadores claros de estrés, pero la confianza es baja. El resultado es incierto.';
        }
    }
}

function showExpectedResult(expected) {
    const expectedHTML = `
        <div class="alert alert-info alert-dismissible fade show" role="alert">
            <i class="fas fa-lightbulb me-2"></i>
            <strong>Resultado esperado:</strong> ${expected}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Remove existing expected result alerts
    const existingAlerts = document.querySelectorAll('.alert-info');
    existingAlerts.forEach(alert => alert.remove());
    
    // Add new alert before the form
    const form = document.getElementById('stressForm');
    if (form) {
        form.insertAdjacentHTML('beforebegin', expectedHTML);
    }
}

function clearForm() {
    const messageText = document.getElementById('messageText');
    const results = document.getElementById('results');
    const charCount = document.getElementById('charCount');
    const sampleTweets = document.querySelectorAll('.sample-tweet');
    
    if (messageText) {
        messageText.value = '';
        messageText.dispatchEvent(new Event('input'));
    }
    
    if (results) {
        results.style.display = 'none';
    }
    
    if (charCount) {
        charCount.textContent = '0';
        charCount.style.color = '#6c757d';
    }
    
    // Remove selections from sample tweets
    sampleTweets.forEach(tweet => tweet.classList.remove('selected'));
    
    // Remove expected result alerts
    const existingAlerts = document.querySelectorAll('.alert-info');
    existingAlerts.forEach(alert => alert.remove());
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
    
    if (results && show) {
        results.style.display = 'none';
    }
}

function showAlert(message, type = 'info') {
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    const form = document.getElementById('stressForm');
    if (form) {
        form.insertAdjacentHTML('beforebegin', alertHTML);
        
        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


