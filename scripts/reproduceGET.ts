
async function reproduceGET() {
    console.log('--- Reproducing Subject GET Error ---');

    // Token from user's curl
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGFiYzgwMzc1MjQ3Y2MyNjY4MDhiNzkiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2ODQxNTk0MSwiZXhwIjoxNzY4NDIzMTQxfQ.qpolYPu8JEesKAHTD4syPyT-88t6BxMTgLjgux5s_TM";

    // URL from user's curl
    // "http://localhost:3001/api/subjects?params%5BtenantId%5D=03254a3f-8c89-4a32-ae74-75e68f8062f1&params%5BschoolId%5D=68a92f1ca69d89189e2f6df6&params%5BclassId%5D=6947b4696c7ce228d16fd39f&params%5BsectionId%5D=692a9ffd6b7f55e303bbb5dc"
    const baseURL = "http://localhost:3001/api/subjects";
    const queryString = "params%5BtenantId%5D=03254a3f-8c89-4a32-ae74-75e68f8062f1&params%5BschoolId%5D=68a92f1ca69d89189e2f6df6&params%5BclassId%5D=6947b4696c7ce228d16fd39f&params%5BsectionId%5D=692a9ffd6b7f55e303bbb5dc";

    // Test 1: Using the encoded string directly (mimic user curl)
    const urlEncoded = `${baseURL}?${queryString}`;
    console.log(`\nTest 1: Fetching Encoded URL: ${urlEncoded}`);

    try {
        const res1 = await fetch(urlEncoded, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });
        console.log(`Test 1 Status: ${res1.status}`);
        const data1 = await res1.json();
        console.log(`Test 1 Body:`, data1);
    } catch (e) {
        console.error("Test 1 Failed:", e);
    }

    // Test 2: Using URLSearchParams logic (mimic typical client)
    console.log(`\nTest 2: Fetching with URLSearchParams`);
    try {
        const params = new URLSearchParams();
        params.append("params[tenantId]", "03254a3f-8c89-4a32-ae74-75e68f8062f1");
        params.append("params[schoolId]", "68a92f1ca69d89189e2f6df6");
        params.append("params[classId]", "6947b4696c7ce228d16fd39f");
        params.append("params[sectionId]", "692a9ffd6b7f55e303bbb5dc");

        const urlParams = `${baseURL}?${params.toString()}`;
        console.log(`Test 2 URL: ${urlParams}`);

        const res2 = await fetch(urlParams, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });
        console.log(`Test 2 Status: ${res2.status}`);
        const data2 = await res2.json();
        console.log(`Test 2 Body:`, data2);
    } catch (e) {
        console.error("Test 2 Failed:", e);
    }
}

reproduceGET();
