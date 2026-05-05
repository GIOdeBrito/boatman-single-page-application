import Boatman from '../boatman.js';
import ViewManager from '../views.js';
import { waitForSeconds } from '../utility/promise.js';

export default new class {
	async adminPanel ()
	{
		await waitForSeconds(1);
		
		await ViewManager.view('/views/admin-panel.php').onload(body =>
		{
			body.querySelector('[data-name="return"]').onclick = () => Boatman.goto('/');
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
