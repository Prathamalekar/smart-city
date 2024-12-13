const db = require("./db");

const dotenv = require("dotenv").config()

const express = require("express")
const app = express()
const port = process.env.PORT || 3000;

const ejs = require("ejs")
app.set("view engine", "ejs")


const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({ extended: true }));
const { text } = require("body-parser");
const { response } = require("express");


app.use(express.static("public"))
app.use('/uploads', express.static('uploads'))

const nodemailer = require("nodemailer")

const session = require("express-session")
app.use(session({
    secret: 'secret',
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
}))

const flash = require("connect-flash");
const { VirtualType } = require("mongoose");
app.use(flash())

// defining user mail in one variable

var uid = "userid "

// starting of real routes 


app.get("/", function (req, res) {
    res.render("index")
})

app.get("/home", function (req, res) {
    res.render("home");
})

app.get("/register", function (req, res) {
    res.render("register", { message: req.flash('mesg') })
})

app.post("/register", function (req, res) {

    const password = req.body.password
    const cpassword = req.body.cpassword

    if (password === cpassword) {
        const data = new db.Person({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            gender: req.body.gender,
            phone: req.body.phone,
            email: req.body.email,
            birthday: req.body.dob,
            password: password
        })

        data.save()

        res.redirect("/login")

    } else {
        req.flash('mesg', 'Password and confirm password must be same')
        res.redirect("/register")

    }
})


app.get("/login", function (req, res) {
    res.render("login")
})

app.post("/login", function (req, res) {

    const role = req.body.role;
    if (role == "admin") {
        res.redirect("/loginadmin")
    }
    if (role == "citizen") {
        res.redirect("/logincitizen")
    }

})

app.get("/loginadmin", function (req, res) {

    res.render("admin", { message: req.flash('message') })
})

app.post("/loginadmin", function (req, res) {
    const email = req.body.email
    const adminkey = req.body.adminkey
    db.Admin.findOne({ email: email }, function (err, info) {
        if (err) {
            console.log(err)
        } else if (!info) {

            res.redirect("/loginadmin")

        } else if (info.adminkey == adminkey) {
            res.redirect("/resolve")
        } else {

            req.flash('message', ' invalid login details ')

            res.redirect("/loginadmin")

        }
    })
})
app.get("/logincitizen", function (req, res) {
    res.render("citizen", { message: req.flash('msg') })
})
app.post("/logincitizen", function (req, res) {
    const email = req.body.email
    const password = req.body.password

    uid = email

    // console.log(uid)

    // verifying user password and email with database
    db.Person.findOne({ email: email }, function (err, details) {
        if (err) {
            console.log(err)
        } else if (!details) {                              // if email is not found 
            req.flash('msg', 'Invalid login details')
            res.redirect("/logincitizen")
        }
        else if (details.password == password) {
            res.redirect("/home")
        } else {
            req.flash('msg', 'Invalid login details')
            res.redirect("/logincitizen")
        }
    })

})


app.get("/changepassword", function (req, res) {
    res.render("changepass", { message: req.flash('msg') })
})



app.post("/changepassword", function (req, res) {
    const emailForPass = req.body.email;

    db.Person.findOne({ email: emailForPass }, function (err, data) {
        if (err) {
            console.log(err)
        } else if (!data) {
            req.flash('msg', 'Email id not found')
            res.redirect("/changepassword")
        } else {
            var otp = Math.floor(Math.random() * 1000000)

            console.log(otp)
            const otps = new db.otp({
                email: emailForPass,
                otp: otp
            })

            otps.save();

            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL,
                    pass: process.env.PASS
                }
            });

            // sending otp in the mail

            let mailDetails = {
                from: 'akshayjadhav77782@gmail.com',
                to: `${emailForPass}`,
                subject: 'Verification code for changing the password',
                // text: `${otp} this is the verification code now you can change password`,
                html: `<div> Your OTP is <b><h1> ${otp}</h1></b><br>
                            <h1><i> Welcome to Smart City !!</i></h1><br>
                             <p> City which shaping tomorrow's future</p>
                        
                </div><br><br>
                Welcome to smart city , This message is provided for updating your password . We hope you find that process easy
                and convinient .  For more information visit www.digicity.com  for contacting us visit our contact us page <br><br>
                <b><i> With regards <br><br> Digicity Team !! </i></b>  `

            };
            console.log(" Mail Details working fine ")

            mailTransporter.sendMail(mailDetails, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Email sent successfully');
                }
            });

            res.redirect("/otp");


            app.get("/otp", function (req, res) {
                res.render("otp")
            })
            app.post("/otp", function (req, res) {
                var otp = req.body.otp;

                db.otp.findOne({ otp: otp }, function (err, info) {
                    if (!info) {
                        req.flash('msg', 'Invalid OTP , Please Try Again After 20 Seconds')
                        res.redirect("/changepassword")
                    } else if (info.otp == otp) {
                        res.redirect("/updatepass")
                        app.get("/updatepass", function (req, res) {
                            res.render("updatepass", { message: req.flash('msg') });
                        })

                        app.post("/updatepass", function (req, res) {
                            const phone = req.body.phone
                            const newpass = req.body.password;
                            const newpass2 = req.body.cpassword;

                            if (newpass == newpass2) {
                                db.Person.findOneAndUpdate({ phone: phone }, { password: newpass }, function (err, data) {
                                    if (err) {
                                        // res.redirect("/logincitizen")
                                        console.log(err)
                                    } else if (!data) {
                                        req.flash('msg', 'phone number not found')
                                        res.redirect("/updatepass")
                                    } else {
                                        res.redirect("/logincitizen")
                                    }
                                })
                            } else {
                                req.flash('msg', 'Password and confirm password must be same')
                                res.redirect("/updatepass")
                            }
                        })
                    } else {
                        res.redirect("/changepassword")
                    }
                })

            })

        }
    })

})

// end of authentication routes 

app.get("/about", function (req, res) {
    res.render("about")
})

app.get("/contact", function (req, res) {
    res.render("contact")
})

app.get("/bills", function (req, res) {
    res.render("bills")
})


// Waste management

app.get("/management", function (req, res) {
    res.render("manager")
})


// using multer to get image in database

var multer = require("multer")
var path = require("path");
const { ObjectId } = require("mongodb");

// middleware of multer 

var storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})

var upload = multer({
    storage: storage
}).single('file')


app.post("/management", upload, function (req, res) {
    const option = req.body.options
    const file = req.file.filename
    const query = req.body.query


    db.Person.findOne({ email: uid }, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            const deta = new db.Waste({
                city: option,
                img: file,
                query: query,
                name: info.firstname,
                email: info.email,
                phone: info.phone
            })

            deta.save(function (err, data) {
                if (err) throw err;
            })
        }

        res.redirect("/home")
    })
})

// waste management admin 

app.get("/resolve", function (req, res) {
    db.Waste.find({}, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            res.render("resolve", { title: "Waste Management", records: data })

        }
    })
})

app.post("/resolve", function (req, res) {

    const button = req.body.wManage
    const wId = req.body.wId


    db.Waste.find({ _id: wId }, function (err, result) {

        if (err) { console.log(err) }
        else {

            if (button == "approve") {


                // sending approved mail to the user 

                let mailTransporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL,
                        pass: process.env.PASS
                    }
                });

                let mailDetails = {
                    from: 'akshayjadhav77782@gmail.com',
                    to: `${result[0].email}`,
                    subject: 'About your waste management query',
                    // text: `${otp} this is the verification code now you can change password`,
                    html: `<div> Your request is <b><h1 style="color:green;">Approved</h1></b><br>
                        <h1> Welcome to Smart City </h1><br>
                         <p><i> City which shaping tomorrow's future </i></p>
                    
            </div><br> 
            Welcome to smart city , Thanking you for taking the initiatives in clean city and green city . <br><br>
            For more information visit www.digicity.com  for contacting us visit our contact us page <br><br>
           <b><i> With regards <br><br> Digicity Team !! </i></b> `

                };
                console.log(" Mail Details working fine ")

                mailTransporter.sendMail(mailDetails, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Email sent successfully');
                    }
                });
            }
        } 
    })


    if (button == "delete") {
        db.Waste.remove({ _id: wId }, function (err) {
            if (err) {
                console.log(err)
            }
            console.log("Deleted successfully ")
        })
    }

    res.redirect("/resolve")

})


// grievances  

app.get("/query", function (req, res) {
    res.render("query")
})


app.post("/query", function (req, res) {
    const sub = req.body.subject
    const address = req.body.address
    const query = req.body.grievance


    db.Person.findOne({ email: uid }, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            const queryData = new db.Grievance({
                subject: sub,
                address: address,
                grievance: query,
                name: info.firstname,
                email: info.email,
                phone: info.phone
            })

            queryData.save(function (err, data) {
                if (err) throw err;
            })
        }

        res.redirect("/home")
    })

})

app.get("/grievance", function (req, res) {

    db.Grievance.find({}, function (err, data) {
        if (err) {
            console.log(err)
        } else {

            res.render("grievance", { title2: "Grievances", records: data })

        }
    })
})



app.post("/grievance", function (req, res) {
    const submit = req.body.first
    const grvId = req.body.id

    db.Grievance.find({ _id: grvId }, function (err, result) {

        if (err) { console.log(err) }
        else {

            if (submit == "approve") {
                console.log("apprroovved")

                
                // console.log(result[0].email)

                // sending approved mail to the user 

                let mailTransporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL,
                        pass: process.env.PASS
                    }
                });

                let mailDetails = {
                    from: 'akshayjadhav77782@gmail.com',
                    to: `${result[0].email}`,
                    subject: 'About your grievance',
                    // text: `${otp} this is the verification code now you can change password`,
                    html: `<div> your request is <b><h1 style ="color:green;">Approved</h1></b><br>
                        <h1><i> Welcome to Smart City </i></h1><br>
                         <p> City which shaping tommorrows future</p>
                    
            </div><br> 
            Welcome to smart city , thanks for raising query keep posting related and important query . 
            For more information visit www.digicity.com  for contacting us visit our contact us page <br><br>
            <b><i> With regards <br><br> Digicity Team !! </i></b> `

                };
                console.log(" Mail Details working fine ")
               

                mailTransporter.sendMail(mailDetails, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Email sent successfully');
                    }
                });
            }
        }
    })


    if (submit == "delete") {

        db.Grievance.remove({ _id: grvId }, function (err) {
            if (err) {
                console.log(err)
            }
        })
        console.log("deleted successfully ")
    }

  

    res.redirect("/grievance")
})



// here is testing 



app.get("/test", function (req, res) {
    // db.Person.find({},function(err,data){
    //     if(err){
    //         console.log(err)
    //     }else {
    //         res.render("test",{title:"Express",records:data})
    //     }
    // })

    res.render("test", { title: "TESTING....." })


})

app.get("/gov",function(req,res){
    res.render("gov")
})

app.post("/gov",function(req,res){
    var btnValue = req.body.govCity
    console.log(btnValue)
   
    res.redirect(`gov/${btnValue}`)
})

app.get("/gov/:id",function(req,res){
    var para = req.params.id

    // res.send("Here is the city !! =====>>>>" + para)

    db.Waste.find({city:para},function(err,wasteData){
        res.render("citywaste",{ title :`Waste Management in ${para}` , ctWstData : wasteData } )
    }) 

})


app.listen(port, function (req, res) {
    console.log("Server started on port 3000 !!")

    console.log(db.database)
})