
import Boatman from "./boatman.js";
import ViewManager from "./views.js";
import AnimationFactory from "./utility/animation-factory.js";
import { waitForSeconds, awaitForTaskAsync } from "./utility/promise.js";
import homeController from "./controllers/home-controller.js";
import aboutController from "./controllers/about-controller.js";
import adminPanelController from "./controllers/admin-panel-controller.js";
import { adminCheck } from "./middlewares/admin-check.js";

window.addEventListener('load', () =>
{
	const body = window['app-body'];

	ViewManager.renderer().setBody(body);

	Boatman.route('/admin/panel', adminPanelController.adminPanel, { middlewares: [ adminCheck ] });
	Boatman.route('/about', aboutController.about);
	Boatman.route('/', homeController.home);

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

	Boatman.useFilePath();
	Boatman.run();
});
