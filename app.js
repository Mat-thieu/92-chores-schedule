const mail = require('@sendgrid/mail');
const moment = require('moment');
const times = require('lodash.times');
const round = require('lodash.round');

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

function getListing({participants, tasks}) {
  function removeWholeNumbers(inp) {
    const whole = parseInt(inp);
    return inp - whole;
  }
  const pLength = participants.length;
  const tLength = tasks.length;
  const weekNo = parseInt(moment().format('w')) - 1;
  const currentStart = weekNo * tLength;

  let start = removeWholeNumbers(currentStart / pLength);
  start = round(start * pLength);

  let cursor = start - 1; // account for zero-index
  const listing = times(tLength, (i) => {
    if (cursor === pLength - 1) {
      cursor = 0;
    } else {
      cursor++;
    }
    return {
      person: participants[cursor],
      task: tasks[i],
    };
  });

  return listing;
}

function generateScheduleTable(listing) {
  const rows = listing.reduce((accumulator, item) => {
    accumulator += `
      <tr>
        <td style="padding-right: 15px">${item.person.name}</td>
        <td style="padding-right: 15px">${item.task.name}</td>
      </tr>
    `;
    return accumulator;
  }, '');

  return `<table>${rows}</table>`;
}

function formatDays(taskDays) {
  return taskDays
    .map(day => days[day])
    .reduce((accumulator, day, index) => {
      if (!index){
        accumulator += day;
      } else if(index === taskDays.length - 1) {
        accumulator += ` or ${day}`;
      } else {
        accumulator += `, ${day}`;
      }

      return accumulator;
    }, '');
}

module.exports = (context, cb) => {
  mail.setApiKey(context.secrets.SENDGRID_API_KEY)
  context.storage.get((error, data) => {
    if (error) return cb(error);

    const listing = getListing(data);
    const scheduleTable = generateScheduleTable(listing);

    const messages = listing.map((item) => {
      return {
        to: item.person.mail,
        from: '92-house@unit92.com',
        subject: `Task: ${item.task.name}`,
        html: `
          <div style="font-family: Verdana, sans-serif !important; font-weight: 200; background: #ecf0f1; padding: 10% 0px; color: #111 !important;">
            <div style="width: 80%; margin: 0 auto; background: white; box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23); padding: 40px; border-radius: 4px;">
              <h1 style="font-weight: 400;">
                Task: ${item.task.name}
              </h1>
              <p>Hi ${item.person.name}! You have a new household task for this week. If you don't have time this week, ask someone to do it for you in the group chat.</p>
              <h3>Task description</h3>
              ${item.task.description}<br><br>
              Do task on: ${formatDays(item.task.days)}
              <h4>Schedule</h4>
              ${scheduleTable}
              <p style="color: #e74c3c;">If you don't do your task or don't attempt to ask someone else, you suck and you should feel bad!</p>
            </div>
          </div>
        `,
      }
    });
    // mail.send(messages);

    cb(null, { data: messages });
  });
};