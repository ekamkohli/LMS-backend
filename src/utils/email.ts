const AWS = require('aws-sdk');
const SES = new AWS.SES({ region: 'us-east-1' });

async function emailEmpPostEmp(empEmail:string,empFirstName:string,empPass:string){
  console.log('from emailEmpPostEmp');
  const myMailOptions = {
    to:empEmail,
    subject: "[LOGIN DETAILS]-" + empFirstName,
    html: "<p>Here are your login details for LMS<br><p>" + "Login   : " + empEmail + "<br>Password : " + empPass
  };
  const res= await emailservice(myMailOptions);
  return res;
}

async function emailEmpPostApp(approverEmail:string,employeeFirstName:string,employeeEmail:string){
  console.log('from emailEmpPostApp');
  const myMailOptions = {
    to:approverEmail,
    subject: "[New Employee]-" + employeeFirstName,
    html: "<p>You have been assigned as an approver for "+employeeFirstName +"<br>Email : "+ employeeEmail
    };
    const res= await emailservice(myMailOptions);
  return res;    
}

async function emailLeavePostEmp(empEmail:string,empFirstName:string,leaveDayBool:boolean,leaveType:string,description:string,startDate:string,endDate:string,daysCount:number){
  let leaveDay;
  if(leaveDayBool){leaveDay="Half Day";} else {leaveDay="Full Day";}

  let d1 = new Date(startDate);
  let myStartDate = d1.getDate() + "/" + (d1.getMonth() + 1) + "/" + d1.getFullYear()
  let d2 = new Date(endDate);
  let myEndDate = d2.getDate() + "/" + (d2.getMonth() + 1) + "/" + d2.getFullYear()

  console.log('from emailLeavePostEmp');

  const myMailOptions = {
    to:empEmail,
    subject: "" + leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + " leave successfully applied by " + empFirstName, // Subject line,
    html: "<p><b>You</b>" + " applied for " + leaveDay + " " + "<b>" + leaveType + "</b>" + " leave from " + "<b>" + myStartDate + "</b>" + " to " + "<b>" + myEndDate + "</b>" + "<p><b>Reason:</b>" + description + "<p><b>No of days</b> : " + daysCount // html body
  };

  const res= await emailservice(myMailOptions);
  return res;
}

async function emailLeavePostApp(approverEmail:string,empFirstName:string,leaveDayBool:boolean,leaveType:string,description:string,startDate:string,endDate:string,daysCount:number){
  let leaveDay;
  if(leaveDayBool){leaveDay="Half Day"} else {leaveDay="Full Day"}

  let d1 = new Date(startDate);
  let myStartDate = d1.getDate() + "/" + (d1.getMonth() + 1) + "/" + d1.getFullYear()
  let d2 = new Date(endDate);
  let myEndDate = d2.getDate() + "/" + (d2.getMonth() + 1) + "/" + d2.getFullYear()

  console.log('from emailLeavePostApp');

  const myMailOptions = {
    to:approverEmail,
    subject: "" + leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + " leave applied by " + empFirstName, // Subject line
    html: "<p><b>" + empFirstName + "</b>" + " applied for " + leaveDay + " " + "<b>" + leaveType + "</b>" + " leave from " + "<b>" + myStartDate + "</b>" + " to " + "<b>" + myEndDate + "</b>" + "<p><b>Reason:</b>" + description + "<p><b>No of days</b> : " + daysCount // html body
  };

  const res= await emailservice(myMailOptions);
  return res; 
}

async function emailLeavePatchAcc(empEmail:string,empFirstName:string,leaveDayBool:boolean,leaveType:string,startDate:string,endDate:string){
  let leaveDay;
  if(leaveDayBool){leaveDay="Half Day"} else {leaveDay="Full Day"}

  let d1 = new Date(startDate);
  let myStartDate = d1.getDate() + "/" + (d1.getMonth() + 1) + "/" + d1.getFullYear()
  let d2 = new Date(endDate);
  let myEndDate = d2.getDate() + "/" + (d2.getMonth() + 1) + "/" + d2.getFullYear()
  
  console.log('from emailLeavePutAcc');
  const myMailOptions = {
    to:empEmail,
    subject: "[APPROVED]-" + leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + " leave applied by " + empFirstName, // Subject line
    html: "<p>The " + leaveDay + " " + leaveType + "</b>" + " leave that you applied from " + "<b>" + myStartDate + "</b>" + " to " + "<b>" + myEndDate + "</b> has been approved." // html body
  };
  const res= await emailservice(myMailOptions);
  return res;
}

async function emailLeavePatchRej(empEmail:string,empFirstName:string,leaveDayBool:boolean,leaveType:string,startDate:string,endDate:string){
  let leaveDay;
  if(leaveDayBool){leaveDay="Half Day"} else {leaveDay="Full Day"}

  let d1 = new Date(startDate);
  let myStartDate = d1.getDate() + "/" + (d1.getMonth() + 1) + "/" + d1.getFullYear()
  let d2 = new Date(endDate);
  let myEndDate = d2.getDate() + "/" + (d2.getMonth() + 1) + "/" + d2.getFullYear()

  console.log('from emailLeavePutRej');
  const myMailOptions = {
    to:empEmail,
    subject: "[REJECTED]-" + leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + " leave applied by " + empFirstName, // Subject line
    html: "<p>The " + leaveDay + " " + leaveType + "</b>" + " leave that you applied from " + "<b>" + myStartDate + "</b>" + " to " + "<b>" + myEndDate + "</b> has been rejected." // html body
  };
  const res= await emailservice(myMailOptions);
  return res;
}

async function emailservice(mailOptions:any) {
  const from = 'lmsblock8@gmail.com';
  const {
    to,
    // reply_to,
    subject,
    html
  } = mailOptions;
  //   const reply_to = 'lmsblock8@gmail.com'
  const sesParams = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `${html}`,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    // ReplyToAddresses:[`${reply_to}`],
    Source: `${from}`,
  };
  console.log(sesParams);
  return SES.sendEmail(sesParams).promise();
}

export { emailEmpPostEmp , emailEmpPostApp , emailLeavePostEmp , emailLeavePostApp , emailLeavePatchAcc , emailLeavePatchRej};
