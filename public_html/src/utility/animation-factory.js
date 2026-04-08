
/**
 * @file Animation factory
 *
 * @example
 * AnimationFactory.new(element)
 *  	.rule('from', 'color: red')
 *		.rule('to', 'color: blue')
 *  	.duration(5)
 *  	.smooth()
 *		.onend(() => console.log('Over'))
 *		.play();
 *
 * @author Giordano de Brito
 */

const KEYFRAMES_SUFIX = '__factory___anim';
const CLASS_SUFIX = '__factory___class';

class Utility
{
	static getRandomName (prefix = '')
	{
		return prefix + String(Date.now());
	}

	static objectToFormatedStyleValues (obj)
	{
		return Object.keys(obj).map(x => {

			const value = obj[x];

			return `${x}: ${value};`;
		}).join('');
	}

	static createStyleElement (data, settings, classname, keyframesname)
	{
		const style = document.createElement('style');
		style.appendChild(document.createTextNode(`
			@keyframes ${keyframesname} {
				${data}
			}
			.${classname} {
				animation-name: ${keyframesname};
				${settings}
			}
		`));

		document.head.appendChild(style);

		return style;
	}
}

class AnimationInstance
{
	#element;

	// Animation data
	#data = '';
	#isOnce = false;

	// Animation settings
	#settings = {
		'animation-duration': '',
		'animation-direction': 'normal',
		'animation-iteration-count': 'initial',
		'animation-fill-mode': 'none',
		'animation-timing-function': 'none'
	};

	#onendcallback = [];

	constructor (element)
	{
		this.#element = element;
	}

	rule (time, value)
	{
		this.#data += `${time} { ${value}; }`;
		return this;
	}

	duration (value)
	{
		this.#settings['animation-duration'] = (value * 1000) + 'ms';
		return this;
	}

	timing (value)
	{
		this.#settings['animation-timing-function'] = value;
		return this;
	}

	smooth ()
	{
		this.#settings['animation-timing-function'] = 'ease';
		return this;
	}

	smoothInOut ()
	{
		this.#settings['animation-timing-function'] = 'ease-in-out';
		return this;
	}

	keep ()
	{
		this.#settings['animation-fill-mode'] = 'forwards';
		this.#isOnce = true;
		return this;
	}

	reverse ()
	{
		this.#settings['animation-direction'] = 'backwards';
		return this;
	}

	pingpong ()
	{
		this.#settings['animation-direction'] = 'alternate';
		this.#settings['animation-iteration-count'] = 'infinite';
		return this;
	}

	repeat (times = 1)
	{
		if(this.#settings['animation-iteration-count'] !== 'infinite')
		{
			this.#settings['animation-iteration-count'] = times;
		}

		return this;
	}

	onend (func)
	{
		this.#onendcallback.push(func);
		return this;
	}

	play ()
	{
		const name = Utility.getRandomName('anim_');
		const classname = name + CLASS_SUFIX;
		const keyframesname = name + KEYFRAMES_SUFIX;

		const settings = Utility.objectToFormatedStyleValues(this.#settings);
		const style = Utility.createStyleElement(this.#data, settings, classname, keyframesname);

		const element = this.#element;

		element.classList.add(classname);

		const function_OnEnd = () => {

			this.#onendcallback.forEach(x => x?.());

			this.#element.removeEventListener('animationend', function_OnEnd);

			if(!this.#isOnce)
			{
				element.classList.remove(classname);
				style.remove();
			}
		};

		this.#element.addEventListener('animationend', function_OnEnd);
	}
}

export default class {

	static new (element)
	{
		return new AnimationInstance(element);
	}

};