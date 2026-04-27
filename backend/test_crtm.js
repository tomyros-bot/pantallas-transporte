const { getStopTimesByStopCode } = require('@dubisdev/crtm-api');
async function test() {
    try {
        const times = await getStopTimesByStopCode('8_11920');
        console.log(JSON.stringify(times, null, 2));
    } catch(e) {
        console.error("Error for 8_11920");
    }
}
test();
