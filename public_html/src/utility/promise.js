
function waitForSeconds(seconds) {
	return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function awaitForTaskAsync (task) {
	return await task();
}

export {
	waitForSeconds,
	awaitForTaskAsync
};
