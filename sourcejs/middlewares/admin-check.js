import Boatman from '../boatman.js';

export async function adminCheck(next)
{
	if(VIEWDATA.role.trim() !== 'admin')
	{
		Boatman.goto('/');
		console.error('Not an admin');
		return;
	}

	await next();
}
