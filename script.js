/**
 * CALCULATRICE - Logique principale
 * Calculatrice web avec interface glassmorphism
 */

(function () {
    'use strict';

    // ============================================
    // SELECTEURS DOM
    // ============================================
    const SELECTORS = {
        result: '#result',
        expression: '#expression',
        digitBtns: '[data-num]',
        operatorBtns: '[data-op]',
        clearBtn: '[data-action="clear"]',
        negateBtn: '[data-action="negate"]',
        percentBtn: '[data-action="percent"]',
        decimalBtn: '[data-action="decimal"]',
        equalsBtn: '[data-action="equals"]',
    };

    const resultEl = document.querySelector(SELECTORS.result);
    const exprEl = document.querySelector(SELECTORS.expression);

    // ============================================
    // ÉTAT DE LA CALCULATRICE
    // ============================================
    let state = {
        current: "0",        // Nombre actuel affiché
        previous: null,      // Premier operand (avant opérateur)
        operator: null,      // Opérateur sélectionné (+, −, ×, ÷)
        justEvaluated: false, // Vrai si on vient de calculer un résultat
        awaitingNewNumber: false // Vrai si on attend un nouveau nombre après un opérateur
    };

    // ============================================
    // CONSTANTES
    // ============================================
    const MAX_DIGITS = 15;
    const LOCALE = 'fr-FR';

    // ============================================
    // FONCTIONS D'AFFICHAGE
    // ============================================

    /**
     * Formate un nombre pour l'affichage (séparateur de milliers FR)
     * @param {string} numStr - Le nombre sous forme de chaîne
     * @returns {string} Nombre formaté
     */
    function formatNumber(numStr) {
        if (numStr === "Erreur") return numStr;

        const [intPart, decPart] = numStr.split(".");
        const withSep = Number(intPart).toLocaleString(LOCALE);

        return decPart !== undefined ? `${withSep},${decPart}` : withSep;
    }

    /**
     * Met à jour l'affichage du résultat et de l'expression
     */
    function updateDisplay() {
        resultEl.textContent = formatNumber(state.current);

        if (state.operator && state.previous !== null) {
            exprEl.textContent = `${formatNumber(state.previous)} ${state.operator}`;
        } else {
            exprEl.textContent = "\u00A0"; // Espace insécable
        }

        // Met en surbrillance l'opérateur actif
        document.querySelectorAll(SELECTORS.operatorBtns).forEach(btn => {
            btn.classList.toggle('active', btn.dataset.op === state.operator);
        });
    }

    // ============================================
    // FONCTIONS DE CALCUL
    // ============================================

    /**
     * Calcule le résultat de deux nombres avec un opérateur
     * @param {string} a - Premier opérande
     * @param {string} b - Deuxième opérande
     * @param {string} op - Opérateur (+, −, ×, ÷)
     * @returns {number} Résultat du calcul
     */
    function compute(a, b, op) {
        const numA = parseFloat(a);
        const numB = parseFloat(b);

        switch (op) {
            case "+": return numA + numB;
            case "−": return numA - numB;
            case "×": return numA * numB;
            case "÷": return numB === 0 ? NaN : numA / numB;
            default: return numB;
        }
    }

    /**
     * Nettoie un résultat de calcul (précision, zéros inutiles)
     * @param {number} num - Le nombre à nettoyer
     * @returns {string} Chaîne nettoyée ou "Erreur"
     */
    function trimResult(num) {
        if (!isFinite(num)) return "Erreur";

        let s = num.toPrecision(12);
        // Supprime les zéros inutiles après la virgule
        if (s.includes(".")) {
            s = s.replace(/0+$/, '').replace(/\.$/, '');
        }
        return s;
    }

    // ============================================
    // FONCTIONS D'ENTRÉE
    // ============================================

    /**
     * Ajoute un chiffre au nombre actuel
     * @param {string} d - Le chiffre à ajouter
     */
    function inputDigit(d) {
        if (state.justEvaluated) {
            // Nouveau calcul après résultat
            state.current = d;
            state.justEvaluated = false;
            state.operator = null;
            state.previous = null;
        } else if (state.awaitingNewNumber) {
            // Premier chiffre après opérateur
            state.current = d;
            state.awaitingNewNumber = false;
        } else if (state.current === "0") {
            // Remplace le zéro initial
            state.current = d;
        } else {
            // Limite le nombre de chiffres
            if (state.current.replace('-', '').replace('.', '').length >= MAX_DIGITS) {
                return;
            }
            state.current += d;
        }
        updateDisplay();
    }

    /**
     * Ajoute un séparateur décimal
     */
    function inputDecimal() {
        if (state.justEvaluated) {
            state.current = "0.";
            state.justEvaluated = false;
            state.operator = null;
            state.previous = null;
        } else if (state.awaitingNewNumber) {
            state.current = "0.";
            state.awaitingNewNumber = false;
        } else if (!state.current.includes(".")) {
            state.current += ".";
        }
        updateDisplay();
    }

    // ============================================
    // FONCTIONS D'OPÉRATIONS
    // ============================================

    /**
     * Sélectionne un opérateur et prépare le calcul suivant
     * @param {string} op - L'opérateur sélectionné
     */
    function chooseOperator(op) {
        if (state.operator && state.previous !== null && !state.justEvaluated && !state.awaitingNewNumber) {
            // Enchaînement de calculs (ex: 2 + 3 + ...)
            const res = compute(state.previous, state.current, state.operator);
            state.previous = isNaN(res) ? "Erreur" : trimResult(res);
            state.current = state.previous;
        } else {
            state.previous = state.current;
        }

        state.operator = op;
        state.justEvaluated = false;
        state.awaitingNewNumber = true;
        updateDisplay();
    }

    /**
     * Calcule et affiche le résultat final
     */
    function equals() {
        if (state.operator === null || state.previous === null) return;

        const res = compute(state.previous, state.current, state.operator);
        state.current = isNaN(res) ? "Erreur" : trimResult(res);
        state.operator = null;
        state.previous = null;
        state.justEvaluated = true;
        updateDisplay();
    }

    // ============================================
    // FONCTIONS UTILITAIRES
    // ============================================

    /**
     * Remet la calculatrice à zéro
     */
    function clearAll() {
        state.current = "0";
        state.previous = null;
        state.operator = null;
        state.justEvaluated = false;
        state.awaitingNewNumber = false;
        updateDisplay();
    }

    /**
     * Inverse le signe du nombre actuel (+/-)
     */
    function negate() {
        if (state.current === "0") return;

        state.current = state.current.startsWith("-")
            ? state.current.slice(1)
            : "-" + state.current;
        state.awaitingNewNumber = false;
        updateDisplay();
    }

    /**
     * Convertit le nombre actuel en pourcentage
     */
    function percent() {
        state.current = String(parseFloat(state.current) / 100);
        state.awaitingNewNumber = false;
        updateDisplay();
    }

    // ============================================
    // ÉVÉNEMENTS - BOUTONS
    // ============================================

    // Chiffres
    document.querySelectorAll(SELECTORS.digitBtns).forEach(btn => {
        btn.addEventListener('click', () => inputDigit(btn.dataset.num));
    });

    // Opérateurs
    document.querySelectorAll(SELECTORS.operatorBtns).forEach(btn => {
        btn.addEventListener('click', () => chooseOperator(btn.dataset.op));
    });

    // Boutons d'action
    document.querySelector(SELECTORS.clearBtn).addEventListener('click', clearAll);
    document.querySelector(SELECTORS.negateBtn).addEventListener('click', negate);
    document.querySelector(SELECTORS.percentBtn).addEventListener('click', percent);
    document.querySelector(SELECTORS.decimalBtn).addEventListener('click', inputDecimal);
    document.querySelector(SELECTORS.equalsBtn).addEventListener('click', equals);

    // ============================================
    // ÉVÉNEMENTS - CLAVIER
    // ============================================

    window.addEventListener('keydown', (e) => {
        const key = e.key;

        if (key >= '0' && key <= '9') {
            inputDigit(key);
        } else if (key === '.' || key === ',') {
            inputDecimal();
        } else if (key === '+') {
            chooseOperator('+');
        } else if (key === '-') {
            chooseOperator('−');
        } else if (key === '*') {
            chooseOperator('×');
        } else if (key === '/') {
            e.preventDefault();
            chooseOperator('÷');
        } else if (key === 'Enter' || key === '=') {
            equals();
        } else if (key === 'Backspace') {
            state.current = state.current.length > 1 ? state.current.slice(0, -1) : "0";
            updateDisplay();
        } else if (key === 'Escape') {
            clearAll();
        }
    });

    // ============================================
    // INITIALISATION
    // ============================================
    updateDisplay();

})();
