import dbConnect from "../lib/mongodb";
import Report from "../models/Report";
import Business from "../models/Business";

async function checkReports() {
    await dbConnect();
    const reports = await Report.find({});
    console.log(`Found ${reports.length} reports.`);
    for (const r of reports) {
        const business = await Business.findById(r.businessId);
        const bizName = business?.name || "Unknown";
        console.log(`Report ID: ${r._id}, Business: ${bizName} (${r.businessId}), Discussion Count: ${r.discussion?.length || 0}`);
        if (r.discussion && r.discussion.length > 0) {
            console.log("Discussion:", JSON.stringify(r.discussion, null, 2));
        }
    }
    process.exit(0);
}

checkReports();
