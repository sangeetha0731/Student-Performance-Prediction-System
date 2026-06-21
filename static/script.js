/* ============================================================
   GRADESCOPE — Main Script
   Handles: predict form · result charts · all interactivity
   Place in: static/script.js
   Requires: Chart.js (loaded via CDN in result.html only)
   ============================================================ */


/* ============================================================
   1. FEATURE METADATA
      Used by impact cards and what-if charts on the result page.
   ============================================================ */

const FEAT = {
    G2: {
        label:  'Second Period Grade',
        icon:   '📈',
        format: v => `${v} / 20`
    },
    G1: {
        label:  'First Period Grade',
        icon:   '📊',
        format: v => `${v} / 20`
    },
    failures: {
        label:  'Past Failures',
        icon:   '⚠️',
        format: v => v == 0 ? 'None' : `${v} failure${v > 1 ? 's' : ''}`
    },
    absences: {
        label:  'School Absences',
        icon:   '🏫',
        format: v => `${v} days`
    },
    studytime: {
        label:  'Study Time',
        icon:   '⏱️',
        format: v => ['', '< 2 hrs', '2 – 5 hrs', '5 – 10 hrs', '> 10 hrs'][v] || v
    },
    higher: {
        label:  'Higher Education Goal',
        icon:   '🎓',
        format: v => v === 'yes' ? 'Yes — Aspires to higher ed' : 'No — Not planning higher ed'
    },
    schoolsup: {
        label:  'School Support',
        icon:   '🤝',
        format: v => v === 'yes' ? 'Yes — Receiving support' : 'No — No extra support'
    },
    health: {
        label:  'Health Status',
        icon:   '💚',
        format: v => `${v} / 5 — ${['', 'Very Bad', 'Bad', 'Okay', 'Good', 'Excellent'][v] || v}`
    },
    famrel: {
        label:  'Family Relationship',
        icon:   '🏠',
        format: v => `${v} / 5 — ${['', 'Very Bad', 'Bad', 'Okay', 'Good', 'Excellent'][v] || v}`
    },
    internet: {
        label:  'Internet at Home',
        icon:   '🌐',
        format: v => v === 'yes' ? 'Yes — Has internet access' : 'No — No internet at home'
    }
};

/* Render order for impact cards: most predictive first */
const FEAT_ORDER = [
    'G2', 'G1', 'failures', 'absences', 'studytime',
    'higher', 'schoolsup', 'health', 'famrel', 'internet'
];


/* ============================================================
   2. PAGE DETECTION + BOOT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* Predict page: has the submit button */
    if (document.getElementById('submit-btn')) {
        initPredictPage();
    }

    /* Result page: has the gauge SVG fill element */
    if (document.getElementById('gaugeFill')) {
        initResultPage();
    }

    /* Index page: has scroll-reveal elements */
    if (document.querySelector('.reveal, .reveal-stagger')) {
        initScrollReveal();
    }
});


/* ============================================================
   3. INDEX PAGE — SCROLL REVEAL
   ============================================================ */

function initScrollReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
        observer.observe(el);
    });
}


/* ============================================================
   4. PREDICT PAGE
   ============================================================ */

/* ---- 4a. Toggle State ---- */

const toggleState = {
    higher:    'yes',
    internet:  'yes',
    schoolsup: 'no'
};

/**
 * Called by the yes/no toggle buttons in predict.html.
 * Updates state and swaps active class.
 */
function setToggle(field, value, btn) {
    toggleState[field] = value;

    const pair = document.getElementById(`${field}-pair`);

    pair.querySelectorAll('.toggle-btn').forEach(b => {
        b.classList.remove('active', 'active-no');
    });

    btn.classList.add('active');

    if (value === 'no') {
        btn.classList.add('active-no');
    }
}


/* ---- 4b. Slider Sync ---- */

/**
 * Syncs a range slider's fill colour and live value display.
 *
 * @param {HTMLInputElement} slider    - The range input element
 * @param {string}           displayId - ID of the element showing the live value
 * @param {boolean}          isGrade   - true = grade slider (0-20), false = absences
 */
function syncSlider(slider, displayId, isGrade) {

    const min = +slider.min;
    const max = +slider.max;
    const val = +slider.value;
    const pct = ((val - min) / (max - min)) * 100;

    let color;

    if (isGrade) {
        if      (val >= 14) color = '#22c55e';   /* green  */
        else if (val >= 10) color = '#f59e0b';   /* yellow */
        else                color = '#ef4444';   /* red    */
    } else {
        /* Absences: higher = worse */
        if      (val > 20)  color = '#ef4444';
        else if (val > 10)  color = '#f59e0b';
        else                color = '#4f7cff';
    }

    slider.style.setProperty('--thumb-c', color);
    slider.style.setProperty('--fill',    pct + '%');

    const el = document.getElementById(displayId);

    if (isGrade) {
        el.style.color  = color;
        el.textContent  = val;
    } else {
        el.style.color  = color;
        el.innerHTML    =
            val + ' <span style="font-size:0.72rem;font-weight:400;color:var(--text-muted)">days</span>';
    }
}


/* ---- 4c. Predict Page Init ---- */

function initPredictPage() {

    /* Initialise slider visuals on load */
    const G1       = document.getElementById('G1');
    const G2       = document.getElementById('G2');
    const absences = document.getElementById('absences');

    if (G1)       syncSlider(G1,       'G1-val',       true);
    if (G2)       syncSlider(G2,       'G2-val',       true);
    if (absences) syncSlider(absences, 'absences-val', false);
}


/* ---- 4d. Form Submit ---- */

/**
 * Collects all 10 form values, POSTs to /predict,
 * stores result + formData in sessionStorage,
 * then navigates to /result-page.
 */
async function submitForm() {

    const btn     = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');
    const errBar  = document.getElementById('error-bar');

    /* Reset error */
    errBar.style.display = 'none';

    /* Loading state */
    btn.disabled          = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    /* Collect all field values */
    const data = {
        G1:        parseInt(document.getElementById('G1').value),
        G2:        parseInt(document.getElementById('G2').value),
        studytime: parseInt(document.getElementById('studytime').value),
        failures:  parseInt(document.getElementById('failures').value),
        absences:  parseInt(document.getElementById('absences').value),
        higher:    toggleState.higher,
        internet:  toggleState.internet,
        schoolsup: toggleState.schoolsup,
        health:    parseInt(document.getElementById('health').value),
        famrel:    parseInt(document.getElementById('famrel').value)
    };

    try {
        const res = await fetch('/predict', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data)
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const result = await res.json();

        /* Persist for result page */
        sessionStorage.setItem('predictionResult', JSON.stringify(result));
        sessionStorage.setItem('formData',         JSON.stringify(data));

        window.location.href = '/result-page';

    } catch (err) {
        console.error('Prediction failed:', err);

        btn.disabled          = false;
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        errBar.style.display  = 'block';
    }
}


/* ============================================================
   5. RESULT PAGE — INIT
   ============================================================ */

function initResultPage() {

    /* Guard: must have Chart.js for charts */
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded. Add the CDN script before script.js.');
        return;
    }

    /* Read stored prediction */
    const raw = sessionStorage.getItem('predictionResult');

    if (!raw) {
        window.location.href = '/predict-page';
        return;
    }

    let result;

    try {
        result = JSON.parse(raw);
    } catch (e) {
        window.location.href = '/predict-page';
        return;
    }

    /* Set Chart.js global dark-theme defaults */
    Chart.defaults.color       = '#7a849e';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.07)';
    Chart.defaults.font.family = "'DM Sans', sans-serif";

    /* Render everything */
    renderGauge(result);
    renderVerdict(result);
    renderRadar(result);
    renderBar(result);
    renderImpactCards(result);
    renderAdvice(result);
    renderWhatIf(result);
}


/* ============================================================
   6. RESULT PAGE — GAUGE
   ============================================================ */

function renderGauge(r) {

    const pct        = r.predicted_grade / 20;
    const ARC_LENGTH = Math.PI * 90;                  /* ≈ 282.74 */
    const offset     = ARC_LENGTH * (1 - pct);

    const fill = document.getElementById('gaugeFill');
    const card = document.getElementById('gaugeCard');

    /* Set colour based on band */
    fill.style.stroke = r.band_color;

    /* Glow tint behind gauge */
    const glowMap = {
        '#22c55e': 'rgba(34,  197, 94,  0.14)',
        '#f59e0b': 'rgba(245, 158, 11,  0.14)',
        '#ef4444': 'rgba(239,  68, 68,  0.14)'
    };

    card.style.setProperty(
        '--gauge-glow',
        glowMap[r.band_color] || 'rgba(79, 124, 255, 0.14)'
    );

    /* Trigger fill animation after one frame */
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            fill.style.strokeDasharray  = ARC_LENGTH;
            fill.style.strokeDashoffset = offset;
        });
    });

    /* Count-up animation for the number and percentage */
    animNum('gaugeNum', 0, r.predicted_grade, 1400, v => v.toFixed(1));
    animNum('gaugePct', 0, r.percentage,       1400, v => Math.round(v) + '%');

    /* Grade band pill */
    const band = document.getElementById('gaugeBand');

    if (band) {
        band.textContent   = r.grade_band;
        band.style.background  = r.band_color + '18';
        band.style.color       = r.band_color;
        band.style.border      = `1px solid ${r.band_color}30`;
    }
}


/* ============================================================
   7. RESULT PAGE — VERDICT CARD
   ============================================================ */

function renderVerdict(r) {

    /* Headline */
    const dir      = r.vs_average === 'above' ? 'above average' : 'below average';
    const headline = document.getElementById('verdictHeadline');

    if (headline) {
        headline.innerHTML =
            `Predicted to finish <em style="color:${r.band_color}">${r.grade_band.toLowerCase()}</em>
             and <em style="color:${r.band_color}">${dir}</em>.`;
    }

    /* Vs-average row numbers */
    const setPredicted = document.getElementById('vsPredicted');
    const setAverage   = document.getElementById('vsAverage');
    const setDelta     = document.getElementById('vsDelta');

    if (setPredicted) setPredicted.textContent = r.predicted_grade;
    if (setAverage)   setAverage.textContent   = r.class_average;

    if (setDelta) {
        const delta    = (r.predicted_grade - r.class_average).toFixed(2);
        const sign     = delta >= 0 ? '+' : '';
        setDelta.textContent = `${sign}${delta}`;
        setDelta.style.color = delta >= 0 ? '#22c55e' : '#ef4444';
    }

    /* First advice snippet inline */
    const firstAdvice = document.getElementById('adviceFirstCard');

    if (firstAdvice && r.advice && r.advice.length) {
        firstAdvice.innerHTML = `
            <div style="
                background : var(--surface-2);
                border     : 1px solid var(--border);
                border-radius : 10px;
                padding    : 14px 16px;
                font-size  : 0.83rem;
                color      : var(--text-muted);
                line-height: 1.65;
                font-weight: 300;
            ">${r.advice[0]}</div>`;
    }
}


/* ============================================================
   8. RESULT PAGE — RADAR CHART
   ============================================================ */

let radarChart = null;

function renderRadar(r) {

    const ctx = document.getElementById('radarChart');
    if (!ctx) return;

    if (radarChart) radarChart.destroy();

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels:   r.radar_data.labels,
            datasets: [{
                label:                'Your Profile',
                data:                 r.radar_data.values,
                fill:                 true,
                backgroundColor:      'rgba(79, 124, 255, 0.15)',
                borderColor:          '#4f7cff',
                borderWidth:          2,
                pointBackgroundColor: '#4f7cff',
                pointBorderColor:     '#4f7cff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor:     '#4f7cff',
                pointRadius:          4,
                pointHoverRadius:     6
            }]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize:        25,
                        color:           '#3d4a63',
                        backdropColor:   'transparent',
                        font: { size: 10 }
                    },
                    grid:        { color: 'rgba(255, 255, 255, 0.06)' },
                    angleLines:  { color: 'rgba(255, 255, 255, 0.06)' },
                    pointLabels: {
                        color: '#7a849e',
                        font:  { size: 11, weight: '500' }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0e1320',
                    borderColor:     'rgba(255, 255, 255, 0.10)',
                    borderWidth:     1,
                    titleColor:      '#f0f2f8',
                    bodyColor:       '#7a849e',
                    padding:         10,
                    callbacks: {
                        label: ctx => ` Score: ${ctx.parsed.r} / 100`
                    }
                }
            },
            animation: { duration: 900, easing: 'easeOutQuart' }
        }
    });
}


/* ============================================================
   9. RESULT PAGE — BAR CHART (You vs Class Average)
   ============================================================ */

let barChart = null;

function renderBar(r) {

    const ctx = document.getElementById('barChart');
    if (!ctx) return;

    if (barChart) barChart.destroy();

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels:   ['Your Prediction', 'Class Average'],
            datasets: [{
                data:            [r.predicted_grade, r.class_average],
                backgroundColor: [r.band_color + 'bb', 'rgba(122, 132, 158, 0.3)'],
                borderColor:     [r.band_color,         'rgba(122, 132, 158, 0.6)'],
                borderWidth:     2,
                borderRadius:    8,
                borderSkipped:   false
            }]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    grid:   { display: false },
                    ticks:  { color: '#7a849e', font: { size: 12 } },
                    border: { color: 'transparent' }
                },
                y: {
                    min:    0,
                    max:    20,
                    grid:   { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks:  { stepSize: 5, color: '#3d4a63', font: { size: 10 } },
                    border: { color: 'transparent' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0e1320',
                    borderColor:     'rgba(255, 255, 255, 0.10)',
                    borderWidth:     1,
                    titleColor:      '#f0f2f8',
                    bodyColor:       '#7a849e',
                    padding:         10,
                    callbacks: {
                        label: ctx => ` Grade: ${ctx.parsed.y} / 20`
                    }
                }
            },
            animation: { duration: 900, easing: 'easeOutQuart' }
        }
    });
}


/* ============================================================
   10. RESULT PAGE — FEATURE IMPACT CARDS
   ============================================================ */

function renderImpactCards(r) {

    const grid = document.getElementById('impactGrid');
    if (!grid) return;

    grid.innerHTML = '';

    /* Normalise importance to a 0–100 bar width */
    const allImportances = Object.values(r.feature_impact).map(f => f.importance);
    const maxImportance  = Math.max(...allImportances);

    FEAT_ORDER.forEach((key, idx) => {

        const fi = r.feature_impact[key];
        if (!fi) return;

        const meta   = FEAT[key] || { label: key, icon: '•', format: v => v };
        const isPos  = fi.impact === 'positive';
        const barPct = Math.round((fi.importance / maxImportance) * 100);
        const delay  = idx * 0.06;

        /* Build card */
        const card = document.createElement('div');
        card.className = 'impact-card';

        card.innerHTML = `
            <div class="impact-card-top">
                <div class="impact-name-row">
                    <span class="impact-icon">${meta.icon}</span>
                    <span class="impact-name">${meta.label}</span>
                </div>
                <div class="impact-badge ${isPos ? 'pos' : 'neg'}">
                    ${isPos ? '↑ Positive' : '↓ Negative'}
                </div>
            </div>
            <div class="impact-value">${meta.format(fi.value)}</div>
            <div class="impact-bar-row">
                <div class="impact-bar-bg">
                    <div class="impact-bar-fill-r"
                         style="width: 0%;
                                background: ${isPos ? '#22c55e' : '#ef4444'};
                                transition: width 1s ease ${delay}s;">
                    </div>
                </div>
                <span class="impact-pct">${Math.round(fi.importance * 100)}% weight</span>
            </div>
        `;

        grid.appendChild(card);

        /* Trigger bar animation next frame */
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const fill = card.querySelector('.impact-bar-fill-r');
                if (fill) fill.style.width = barPct + '%';
            });
        });
    });
}


/* ============================================================
   11. RESULT PAGE — ADVICE CARDS
   ============================================================ */

function renderAdvice(r) {

    const list = document.getElementById('adviceList');
    if (!list) return;

    list.innerHTML = '';

    /* advice[0] is already shown in the verdict card, start from [1] */
    const items = (r.advice || []).slice(1);

    if (!items.length) {
        list.innerHTML = `
            <div style="font-size:0.85rem; color:var(--text-dim); padding:12px 0;">
                No further advice — your profile looks strong across all factors.
            </div>`;
        return;
    }

    items.forEach((text, i) => {
        const card = document.createElement('div');
        card.className = 'advice-card';
        card.innerHTML = `
            <div class="advice-num">${i + 2}</div>
            <div class="advice-text">${text}</div>
        `;
        list.appendChild(card);
    });
}


/* ============================================================
   12. RESULT PAGE — WHAT-IF CHARTS
   ============================================================ */

let studyChart   = null;
let absenceChart = null;

function renderWhatIf(r) {

    /* Read saved form data so we can highlight the student's actual value */
    let formData = {};

    try {
        formData = JSON.parse(sessionStorage.getItem('formData') || '{}');
    } catch (e) { /* ignore */ }

    /* ---- Study Time chart ---- */

    const stCtx = document.getElementById('studyChart');

    if (stCtx) {

        if (studyChart) studyChart.destroy();

        const stLabels  = ['< 2 hrs', '2 – 5 hrs', '5 – 10 hrs', '> 10 hrs'];
        const stGrades  = r.whatif_studytime.map(d => d.grade);
        const stCurrent = r.whatif_studytime.findIndex(
            d => d.studytime === (formData.studytime || 2)
        );

        studyChart = new Chart(stCtx, {
            type: 'line',
            data: {
                labels:   stLabels,
                datasets: [{
                    label:               'Predicted Grade',
                    data:                stGrades,
                    borderColor:         '#4f7cff',
                    borderWidth:         2,
                    backgroundColor:     'rgba(79, 124, 255, 0.08)',
                    fill:                true,
                    tension:             0.35,
                    pointBackgroundColor: stGrades.map((_, i) =>
                        i === stCurrent ? '#00e5c0' : 'rgba(79, 124, 255, 0.7)'
                    ),
                    pointBorderColor: stGrades.map((_, i) =>
                        i === stCurrent ? '#00e5c0' : '#4f7cff'
                    ),
                    pointRadius:      stGrades.map((_, i) => i === stCurrent ? 8 : 4),
                    pointHoverRadius: 7
                }]
            },
            options: whatifOptions(
                'Predicted Grade',
                stCurrent,
                stLabels[stCurrent] || ''
            )
        });
    }

    /* ---- Absences chart ---- */

    const abCtx = document.getElementById('absenceChart');

    if (abCtx) {

        if (absenceChart) absenceChart.destroy();

        const abLabels  = r.whatif_absences.map(d => `${d.absences}d`);
        const abGrades  = r.whatif_absences.map(d => d.grade);
        const currentAb = formData.absences || 0;

        /* Find closest pre-computed absence value to the student's actual value */
        const abCurrent = r.whatif_absences.reduce((best, d, i, arr) =>
            Math.abs(d.absences - currentAb) < Math.abs(arr[best].absences - currentAb) ? i : best, 0
        );

        absenceChart = new Chart(abCtx, {
            type: 'line',
            data: {
                labels:   abLabels,
                datasets: [{
                    label:               'Predicted Grade',
                    data:                abGrades,
                    borderColor:         '#ef4444',
                    borderWidth:         2,
                    backgroundColor:     'rgba(239, 68, 68, 0.06)',
                    fill:                true,
                    tension:             0.35,
                    pointBackgroundColor: abGrades.map((_, i) =>
                        i === abCurrent ? '#00e5c0' : 'rgba(239, 68, 68, 0.7)'
                    ),
                    pointBorderColor: abGrades.map((_, i) =>
                        i === abCurrent ? '#00e5c0' : '#ef4444'
                    ),
                    pointRadius:      abGrades.map((_, i) => i === abCurrent ? 8 : 4),
                    pointHoverRadius: 7
                }]
            },
            options: whatifOptions(
                'Predicted Grade',
                abCurrent,
                abLabels[abCurrent] || ''
            )
        });
    }
}

/**
 * Shared Chart.js options object for both what-if line charts.
 */
function whatifOptions(yLabel, currentIdx, currentLabel) {

    return {
        responsive:          true,
        maintainAspectRatio: true,
        scales: {
            x: {
                grid:   { display: false },
                ticks:  {
                    color: '#7a849e',
                    font:  { size: 10 }
                },
                border: { color: 'transparent' }
            },
            y: {
                min:    0,
                max:    20,
                grid:   { color: 'rgba(255, 255, 255, 0.05)' },
                ticks:  { stepSize: 5, color: '#3d4a63', font: { size: 10 } },
                border: { color: 'transparent' }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0e1320',
                borderColor:     'rgba(255, 255, 255, 0.10)',
                borderWidth:     1,
                titleColor:      '#f0f2f8',
                bodyColor:       '#7a849e',
                padding:         10,
                callbacks: {
                    label: ctx => {
                        const suffix = ctx.dataIndex === currentIdx
                            ? ' ← your current value'
                            : '';
                        return ` Predicted: ${ctx.parsed.y.toFixed(2)} / 20${suffix}`;
                    }
                }
            }
        },
        animation: { duration: 800 }
    };
}


/* ============================================================
   13. UTILITY — ANIMATED NUMBER COUNT-UP
   ============================================================ */

/**
 * Animates a text element from `from` to `to` over `duration` ms.
 *
 * @param {string}   id        - Target element ID
 * @param {number}   from      - Start value
 * @param {number}   to        - End value
 * @param {number}   duration  - Animation duration in ms
 * @param {Function} formatter - Function(currentValue) => string
 */
function animNum(id, from, to, duration, formatter) {

    const el = document.getElementById(id);
    if (!el) return;

    const start = Date.now();

    function tick() {
        const elapsed  = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);

        /* Ease-out cubic */
        const eased   = 1 - Math.pow(1 - progress, 3);
        const current = from + (to - from) * eased;

        el.textContent = formatter(current);

        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}