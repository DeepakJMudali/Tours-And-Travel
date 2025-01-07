const nodemailer = require("nodemailer")
const pug = require("pug")
const htmlToText = require('html-to-text')



module.exports = class Email {
    constructor(user,url)
    {
        this.to =user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = `Deepak Mudali <${process.env.EMAIL_FROM}>`
    }
    newTransport()
    {
        if(process.env.NODE_ENV === "production")
        {
                return 1;
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port : process.env.EMAIL_PORT,
            secure: false,  
            auth:{
                user: process.env.EMAIL_USERNAME,
                pass : process.env.EMAIL_PASSWORD
            }
        })
    
    }
    async send(template,subject)
    {
      //1) render html  based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{
        firstName: this.firstName,
        url: this.url,
        subject
    })
        

      //2) Define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.htmlToText(html)
      }
    
      await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome()
    {
       await this.send("welcome", 'welcome to the Natours Family!')
    }
    async sendPasswordReset()
     {
      await this.send(
        'passwordReset',
        'Your password reset token (valid for only 10 minutes)')
    }

}


// const sendEmail=options=>{

//     // Create Transporter
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port : process.env.EMAIL_PORT,
//         auth:{
//             user: process.env.EMAIL_USERNAME,
//             pass : process.env.EMAIL_PASSWORD
//         }
//     })

//     // Add email options before sending the email
//     const emailOptions = {
//         from: 'Deepak Mudali <deepak.mudali90@gmail.com>',
//         to : options.to,
//         subject: options.subject,
//         text :options.message
//     }

//     // send the email
//     transporter.sendMail(emailOptions)
// }



//module.exports = sendEmail





