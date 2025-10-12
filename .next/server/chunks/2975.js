exports.id=2975,exports.ids=[2975],exports.modules={66147:(a,b,c)=>{"use strict";c.d(b,{N:()=>h});var d=c(28120),e=c(23168),f=c(70373),g=c(7028);let h={adapter:(0,e.y)(f.z),session:{strategy:"jwt"},pages:{signIn:"/login",signOut:"/",error:"/login"},providers:[(0,d.A)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(a){if(!a?.email||!a?.password)return null;let b=await f.z.user.findUnique({where:{email:a.email}});return b&&b.password&&await g.Ay.compare(a.password,b.password)?{id:b.id,email:b.email,name:b.name,isAdmin:b.isAdmin}:null}})],callbacks:{jwt:async({token:a,user:b})=>(b&&(a.id=b.id,a.isAdmin=b.isAdmin),a),session:async({session:a,token:b})=>(b&&(a.user.id=b.id,a.user.isAdmin=b.isAdmin),a)}}},70373:(a,b,c)=>{"use strict";c.d(b,{z:()=>e});var d=c(96330);let e=globalThis.prisma??new d.PrismaClient},78335:()=>{},81929:(a,b,c)=>{"use strict";c.d(b,{Iw:()=>h,Jg:()=>i,_X:()=>f,hT:()=>g});var d=c(52731);let e=process.env.SMTP_USER&&process.env.SMTP_PASSWORD?d.createTransport({host:process.env.SMTP_HOST||"smtp.gmail.com",port:parseInt(process.env.SMTP_PORT||"587"),secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}}):null;async function f(a,b){if(!e)return console.warn("Email transporter not configured - skipping email"),{success:!1,skipped:!0,error:"Transporter not configured"};let c=a.player1Id===b?a.player1:a.player2,d=a.player1Id===b?a.player2:a.player1,f=new Date(a.scheduledTime),g=f.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),h=f.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0}),i=a.court?`${a.court.name}${a.court.location?` (${a.court.location})`:""}`:"TBD",j=`Match Reminder: You vs ${d.name} - ${g}`,k=`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .match-details { background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #6b7280; }
        .value { color: #111827; font-size: 16px; }
        .opponent-info { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbbf24; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .button { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Match Reminder</h1>
          <p style="margin: 5px 0; opacity: 0.9;">Your upcoming racquetball match</p>
        </div>

        <div class="content">
          <p>Hi ${c.name},</p>

          <p>This is a reminder about your upcoming racquetball match:</p>

          <div class="match-details">
            <div class="detail-row">
              <span class="label">Date:</span><br>
              <span class="value">${g}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time:</span><br>
              <span class="value">${h}</span>
            </div>
            <div class="detail-row">
              <span class="label">Court:</span><br>
              <span class="value">${i}</span>
            </div>
          </div>

          <div class="opponent-info">
            <h3 style="margin-top: 0;">Your Opponent</h3>
            <p><strong>Name:</strong> ${d.name}</p>
            <p><strong>Phone:</strong> ${d.phone||"Not provided"}</p>
            <p><strong>Email:</strong> ${d.email}</p>
            <p style="margin-bottom: 0; font-size: 14px; color: #6b7280;">
              Feel free to contact your opponent to confirm or if you need to reschedule.
            </p>
          </div>

          <p>Good luck with your match!</p>

          <div class="footer">
            <p>If you need to cancel or reschedule, please contact your opponent directly and notify the league administrator.</p>
            <p style="font-size: 12px;">You're receiving this email because you're registered for a racquetball league.
            To update your notification preferences, please log into your account.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,l=`
Match Reminder

Hi ${c.name},

This is a reminder about your upcoming racquetball match:

Date: ${g}
Time: ${h}
Court: ${i}

YOUR OPPONENT:
Name: ${d.name}
Phone: ${d.phone||"Not provided"}
Email: ${d.email}

Feel free to contact your opponent to confirm or if you need to reschedule.

Good luck with your match!

---
If you need to cancel or reschedule, please contact your opponent directly and notify the league administrator.
  `;try{return await e.sendMail({from:`"Racquetball League" <${process.env.SMTP_FROM||process.env.SMTP_USER}>`,to:c.email,subject:j,text:l,html:k}),console.log(`Match reminder sent to ${c.email}`),{success:!0}}catch(a){return console.error("Error sending email:",a),{success:!1,error:a}}}async function g(a){if(!e)return console.warn("Email transporter not configured - skipping match reminders"),[];let b=[];for(let c of a)c.player1.emailNotifications&&b.push(await f(c,c.player1Id)),c.player2.emailNotifications&&b.push(await f(c,c.player2Id)),c.player3&&c.player3Id&&c.player3.emailNotifications&&b.push(await f(c,c.player3Id)),c.player4&&c.player4Id&&c.player4.emailNotifications&&b.push(await f(c,c.player4Id));return b}async function h(a,b,c){if(!e)return void console.warn("Email transporter not configured - skipping league registration confirmation email");let d=b.divisions.find(a=>a.id===c),f=`Registration Confirmed - ${b.name}`,g=`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Registration Confirmed!</h1>
        </div>

        <div class="content">
          <p>Hi ${a.name},</p>

          <p>Your registration for the following league has been confirmed:</p>

          <div class="details">
            <h3 style="margin-top: 0; color: #10b981;">League Details</h3>
            <p><strong>League:</strong> ${b.name}</p>
            <p><strong>Division:</strong> ${d?.name||"TBD"}</p>
            <p><strong>Start Date:</strong> ${new Date(b.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(b.endDate).toLocaleDateString()}</p>
            <p><strong>Game Type:</strong> ${b.gameType}</p>
            <p><strong>League Fee:</strong> ${b.isFree?"FREE":`$${b.leagueFee?.toFixed(2)||"0.00"}`}</p>
          </div>

          <p>Your match schedule will be available soon. You'll receive an email notification when it's ready.</p>

          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
          </div>

          <p style="margin-top: 30px;">Good luck in the league!</p>
          <p>- The Racquetball League Team</p>
        </div>
      </div>
    </body>
    </html>
  `;try{return await e.sendMail({from:`"Racquetball League" <${process.env.SMTP_FROM||process.env.SMTP_USER}>`,to:a.email,subject:f,html:g}),console.log(`League registration confirmation sent to ${a.email}`),{success:!0}}catch(a){return console.error("Error sending registration confirmation:",a),{success:!1,error:a}}}async function i(a,b,c,d){if(!e)return console.warn("Email transporter not configured - skipping league announcement emails"),[];let f=`${b.name} - ${c}`,g=[];for(let h of a){if(!h.emailNotifications)continue;let a=`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .announcement { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbbf24; }
          .button { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${b.name} Announcement</h1>
          </div>

          <div class="content">
            <p>Hi ${h.name},</p>

            <div class="announcement">
              <h3 style="margin-top: 0; color: #92400e;">${c}</h3>
              <div style="white-space: pre-wrap;">${d}</div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              If you have any questions, please contact the league administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;try{await e.sendMail({from:`"Racquetball League" <${process.env.SMTP_FROM||process.env.SMTP_USER}>`,to:h.email,subject:f,html:a}),g.push({email:h.email,success:!0})}catch(a){console.error(`Error sending announcement to ${h.email}:`,a),g.push({email:h.email,success:!1,error:a})}}return g}},96487:()=>{}};