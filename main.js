import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import 'splitting/dist/splitting.css';
import 'splitting/dist/splitting-cells.css';
import Splitting from 'splitting';

gsap.registerPlugin(ScrollTrigger);

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Class representing one line
 */
class Line {
    // line position
    position = -1;
    // cells/chars
    cells = [];

    /**
     * Constructor.
     * @param {Element} DOM_el - the char element (<span>)
     */
    constructor(linePosition) {
        this.position = linePosition;
    }
}

/**
 * Class representing one cell/char
 */
class Cell {
    // DOM elements
    DOM = {
        // the char element (<span>)
        el: null,
    };
    // cell position
    position = -1;
    // previous cell position
    previousCellPosition = -1;
    // original innerHTML
    original;
    // current state/innerHTML
    state;

    /**
     * Constructor.
     * @param {Element} DOM_el - the char element (<span>)
     */
    constructor(DOM_el, {
        position,
        previousCellPosition
    } = {}) {
        this.DOM.el = DOM_el;
        this.original = this.DOM.el.innerHTML;
        this.state = this.original;
        this.position = position;
        this.previousCellPosition = previousCellPosition;
    }
    /**
     * @param {string} value
     */
    set(value) {
        this.state = value;
        this.DOM.el.innerHTML = this.state;
    }
}

/**
 * Class representing the TypeShuffle object
 */
export class TypeShuffle {
    // DOM elements
    DOM = {
        // the main text element
        el: null,
    };
    // array of Line objs
    lines = [];
    // array of letters and symbols
    lettersAndSymbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '!', '@', '#', '$', '&', '*', '(', ')', '-', '_', '+', '=', '/', '[', ']', '{', '}', ';', ':', '<', '>', ',', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    // effects and respective methods
    effects = {
        'fx3': () => this.fx3(),
    };
    totalChars = 0;
    duration = 750;

    /**
     * Constructor.
     * @param {Element} DOM_el - main text element
     */
    constructor(DOM_el) {
        this.DOM.el = DOM_el;
        // Apply Splitting (two times to have lines, words and chars)
        const results = Splitting({
            target: this.DOM.el,
            by: 'lines'
        })
        results.forEach(s => Splitting({ target: s.words }));

        // for every line
        for (const [linePosition, lineArr] of results[0].lines.entries()) {
            // create a new Line
            const line = new Line(linePosition);
            let cells = [];
            let charCount = 0;
            // for every word of each line
            for (const word of lineArr) {
                // for every character of each line
                for (const char of [...word.querySelectorAll('.char')]) {
                    cells.push(
                        new Cell(char, {
                            position: charCount,
                            previousCellPosition: charCount === 0 ? -1 : charCount-1
                        })
                    );
                    ++charCount;
                }
            }
            line.cells = cells;
            this.lines.push(line);
            this.totalChars += charCount;
        }

        // TODO
        // window.addEventListener('resize', () => this.resize());
    }
    /**
     * clear all the cells chars
     */
    clearCells() {
        for (const line of this.lines) {
            for (const cell of line.cells) {
                gsap.set(cell.DOM.el, {opacity: 0});
            }
        }
    }

    resetCells() {
        for (const line of this.lines) {
            gsap.to(line.cells.map(cell => cell.DOM.el), {
                opacity: 0,
                duration: 0.5,
                stagger: {
                    amount: 1,
                    from: "random"
                }
            });
        }
    }

    /**
     *
     * @returns {string} a random char from this.lettersAndSymbols
     */
    getRandomChar() {
        return this.lettersAndSymbols[Math.floor(Math.random() * this.lettersAndSymbols.length)];
    }
    fx3() {
        const MAX_CELL_ITERATIONS = 4;
        let finished = 0;
        this.clearCells();

        const loop = (line, cell, iteration = 0) => {
            if ( iteration === MAX_CELL_ITERATIONS-1 ) {
                cell.set(cell.original);
                ++finished;
                if ( finished === this.totalChars ) {
                    this.isAnimating = false;
                }
            }
            else {
                cell.set(this.getRandomChar());
            }
            gsap.to(cell.DOM.el, {opacity: 1, duration: this.duration/1000});

            ++iteration;
            if ( iteration < MAX_CELL_ITERATIONS ) {
                setTimeout(() => loop(line, cell, iteration), this.duration/10);
            }
        };

        for (const line of this.lines) {
            for (const cell of line.cells) {
                setTimeout(() => loop(line, cell), randomNumber(0, this.duration));
            }
        }
    }
    /**
     * call the right effect method (defined in this.effects)
     * @param {string} effect - effect type
     */
    trigger(effect = 'fx3') {
        if ( !(effect in this.effects) || this.isAnimating ) return;
        this.isAnimating = true;
        this.effects[effect]();
    }

    /**
     * Initialize the element based on the trigger type
     * @param {string} triggerType - trigger type
     */
    initialize(triggerType, duration) {
        this.duration = duration;
        if (triggerType === 'load' || triggerType === 'scroll') {
            this.clearCells();
        }
    }
}

const textElements = [...document.querySelectorAll('[data-effect="glitch"]')];

textElements.forEach((textElement) => {
    const ts = new TypeShuffle(textElement);
    const triggerType = textElement.getAttribute('data-trigger') || 'click';
    const scrollOnce = textElement.getAttribute('data-scroll-once') ? textElement.getAttribute('data-scroll-once') === 'true' : true;
    const duration = parseInt(textElement.getAttribute('data-duration')) || 750;
    const delay = parseInt(textElement.getAttribute('data-delay')) || 5000;

    ts.initialize(triggerType, duration);

    const triggerEffect = () => ts.trigger('fx3');

    switch (triggerType) {
        case 'load':
            window.addEventListener('load', () => setTimeout(triggerEffect, delay));
            break;
        case 'click':
            textElement.addEventListener('click', triggerEffect);
            break;
        case 'scroll':
            ScrollTrigger.create({
                trigger: textElement,
                start: 'top 75%',
                end: 'bottom top',
                onEnter: triggerEffect,
                onLeaveBack: scrollOnce ? null : () => ts.resetCells(),
                once: scrollOnce
            });
            break;
        default:
            textElement.addEventListener('click', triggerEffect);
            break;
    }
});
