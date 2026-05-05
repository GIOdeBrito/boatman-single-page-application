import Boatman from '../boatman.js';
import ViewManager from '../views.js';

export default new class {
	async about ()
	{
		await ViewManager.view('/views/about.php').onload(() =>
		{
			document.querySelector('[data-name="return"]').onclick = () => Boatman.goto('/');
			console.log('About page!');
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
