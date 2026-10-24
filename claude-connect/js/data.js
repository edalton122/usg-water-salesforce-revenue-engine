/* claude-connect: single config for both tabs. No build step, no CDN. */
window.CC = {
  meta: {
    title: "Claude + Salesforce",
    disclaimer: "Illustrative. A conceptual walkthrough of Claude connected to Salesforce, built from this org's real screens.",
  },

  tabs: [
    {
      id: "desktop",
      label: "Desktop",
      device: "desktop",
      items: [
        {
          id: "d1",
          kind: "read",
          prompt: "Where are deals getting stuck right now?",
          reply:
            "Looking at open pipeline by stage across your book — Bid Submitted and Findings Presented deals are taking the longest to move, both averaging about 25 days. Council / Board Approval and Interest Confirmed move fastest once they get there.",
          artifact: {
            title: "Avg days in stage",
            bars: [
              { label: "Bid Submitted", value: 25.2, max: 30 },
              { label: "Findings Presented", value: 25.2, max: 30 },
              { label: "Solution Presented", value: 24.3, max: 30 },
              { label: "Council / Board", value: 18.1, max: 30 },
            ],
          },
          sf: {
            image: "desktop1_report.png",
            caption: "Live in Salesforce: USG Revenue Cockpit \u2014 Avg Days in Stage",
            glow: true,
          },
        },
        {
          id: "d2",
          kind: "read",
          prompt: "What's the status of the Brookhaven account?",
          reply:
            "City of Brookhaven Water Utility \u2014 active customer since 2006, 5 tanks, $42,150 past due. Two open deals: Hilltop Program Renewal ($186K, health 20, needs attention) and North Tower Rehab + Eastside Program ($3.235M, health 73, Solution Presented).",
          sf: {
            image: "desktop2_account.png",
            caption: "Live in Salesforce: Account 360 \u2014 City of Brookhaven Water Utility",
            highlights: [
              { x: 2, y: 41.2, w: 12.5, h: 13.2, delay: 300 },
              { x: 54, y: 41.2, w: 13.5, h: 13.2, delay: 1100 },
              { x: 2, y: 76.5, w: 65, h: 9.5, delay: 1900 },
            ],
          },
        },
        {
          id: "d3",
          kind: "write",
          prompt: "Pricing on North Tower just got approved \u2014 move it to Council / Board Approval.",
          reply: "Got it. Here's the update I'd make \u2014 take a look before I apply it:",
          proposal: {
            summary: "Brookhaven \u2013 North Tower Rehab + Eastside Program",
            changes: [
              { field: "Pricing Status", from: "Ready for Approval", to: "Approved" },
              { field: "Stage", from: "Solution Presented", to: "Council / Board Approval" },
            ],
            question: "Apply this change?",
          },
          replyAfter:
            "Done \u2014 stage moved to Council / Board Approval. Deal health is now 80, up from 73.",
          sf: {
            before: "desktop3_opp_before.png",
            after: "desktop3_opp_after.png",
            caption: "Live in Salesforce: North Tower Rehab + Eastside Program",
            highlights: [{ x: 2, y: 61, w: 62, h: 15, delay: 200 }],
            toast: "Updated by Claude \u00b7 just now",
          },
        },
      ],
    },
    {
      id: "mobile",
      label: "Mobile",
      device: "mobile",
      items: [
        {
          id: "m1",
          kind: "read",
          voice: true,
          prompt: "I'm going to be at Brookhaven in Atlanta tomorrow \u2014 what should I prioritize nearby?",
          reply:
            "Brookhaven is your primary stop. Hilltop Program Renewal needs urgent attention \u2014 $186K, health 20, closes in 9 days. North Tower is healthier at 73, it just needs a council meeting date on the books.",
          sf: {
            image: "mobile4_radar.png",
            caption: "Live in Salesforce: Agentforce, from the Brookhaven visit plan",
            glow: true,
          },
        },
        {
          id: "m2",
          kind: "write",
          voice: true,
          prompt:
            "Log my visit at Brookhaven \u2014 talked to Marcus Lee, tank 3 needs inspection, following up next week.",
          reply: "Here's what I'll log from that \u2014 confirm and I'll save it to the account:",
          proposal: {
            summary: "City of Brookhaven Water Utility",
            changes: [
              { field: "New call", to: "Call: Brookhaven site visit with Marcus Lee \u00b7 Today" },
              { field: "New task", to: "Follow up with Marcus Lee: tank inspection \u00b7 Oct 31" },
            ],
            question: "Save it?",
          },
          replyAfter: "Logged. Anything else before you head out?",
          sf: {
            before: "mobile5_timeline_before.png",
            after: "mobile5_timeline_after.png",
            caption: "Live in Salesforce: Account activity timeline",
            toast: "Logged by Claude \u00b7 just now",
          },
        },
        {
          id: "m3",
          kind: "write",
          voice: true,
          prompt:
            "Tank 3's hatch still needs replacing \u2014 push the inspection date up to this Friday so we get ahead of it.",
          reply: "I can move that up on the asset record \u2014 here's the change:",
          proposal: {
            summary: "North Tower \u00b7 Asset",
            changes: [{ field: "Next Inspection Due", from: "9/24/2027", to: "10/30/2026" }],
            question: "Apply this change?",
          },
          replyAfter: "Done \u2014 North Tower's next inspection is now set for October 30.",
          sf: {
            before: "mobile6_tank_before.png",
            after: "mobile6_tank_after.png",
            caption: "Live in Salesforce: North Tower \u2014 Asset record",
            toast: "Updated by Claude \u00b7 just now",
          },
        },
      ],
    },
  ],
};
