import Boatman from '../boatman.js';
import ViewManager from '../views.js';

export default new class {

	async home ()
	{
		await ViewManager.view('/views/home.php').onload(() =>
		{
			document.querySelector('[data-name="loadabout"]').onclick = () => Boatman.goto('/about');
			document.querySelector('[data-name="loadadm"]').onclick = () => Boatman.goto('/admin/panel');
			console.log('Home page!');
		})
		.onbeforeunload(() =>
		{
			console.log('before unload');
		})
		.onafterunload(() =>
		{
			console.log('after unload');
		})
		.render();
	}

}();
