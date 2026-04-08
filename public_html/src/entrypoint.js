
import Boatman from "./boatman.js";
import ViewManager from "./views.js";
import AnimationFactory from "./utility/animation-factory.js";
import { waitForSeconds, awaitForTaskAsync } from "./utility/promise.js";

window.addEventListener('load', () => {

	const body = window['app-body'];

	ViewManager.renderer().setBody(body);

	Boatman.route('/admin/panel', Views.adminPanel);
	Boatman.route('/about', Views.about);
	Boatman.route('/', Views.home);

	Boatman.use(next => {

		console.log('Loading new view');

		next();
	});

	Boatman.use(async next => {

		body.style.opacity = 0;
		body.style.pointerEvents = 'none';
		await waitForSeconds(.15);

		await next();

		await waitForSeconds(.15);
		body.style.opacity = '';
		body.style.pointerEvents = '';
	});

	//Boatman.setBasePath('/boatapp');
	Boatman.useFilePath();
	Boatman.run();
});

class Middlewares
{
	static async adminCheck (res, next)
	{
		if(VIEWDATA.role.trim() !== 'admin')
		{
			Boatman.goto('/');
			console.error('Not an admin');
			return;
		}

		await next();
	}
}

class Views
{
	static async home ()
	{
		await ViewManager.view('/views/home.php').onload(() => {

			document.querySelector('[data-name="loadabout"]').onclick = () => Boatman.goto('/about');
			document.querySelector('[data-name="loadadm"]').onclick = () => Boatman.goto('/admin/panel');
			console.log('Home page!');
		})
		.onbeforeunload(() => {

			console.log('unloaded');
		})
		.render();
	}

	static async about ()
	{
		await ViewManager.view('/views/about.php').onload(() => {

			document.querySelector('[data-name="return"]').onclick = () => Boatman.goto('/');
			console.log('About page!');
		})
		.render();
	}

	static async adminPanel ()
	{
		await waitForSeconds(1);

		await ViewManager.view('/views/admin-panel.php').onload(body => {

			body.querySelector('[data-name="return"]').onclick = () => Boatman.goto('/');
		})
		.render();
	}
}

