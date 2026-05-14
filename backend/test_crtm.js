const crtm = require('@dubisdev/crtm-api');

async function test() {
    try {
        console.log("Testing CRTM API for stop 18335...");
        const data1 = await crtm.getStopTimesByStopCode('18335');
        console.log("Stop 18335:", JSON.stringify(data1, null, 2));

        console.log("Testing CRTM API for stop 18336...");
        const data2 = await crtm.getStopTimesByStopCode('18336');
        console.log("Stop 18336:", JSON.stringify(data2, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
