require('dotenv').config();
const express = require("express");
const router = express.Router();
const adminCollection = require("../models/admin");
const employerSchema=require('../models/employer')

const appJobs=require('../models/appliedjobs')

const nodemailer = require('nodemailer');


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyfyToken =require('../middleware/tokenAuth')


router.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await adminCollection.findOne({ username });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { adminId: admin._id, username: admin.username },
            'your-secret-key',
            { expiresIn: '1h' }
        );

        res.cookie('AuthToken', token, { httpOnly: true, secure: false }); 
        res.status(200).json({ message: 'Login Success', token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});



router.get("/logout", (req, res) => {
    res.clearCookie("AuthToken");
    res.status(200).send("Logout successful");
});


// adding employer

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });


router.post('/add-employer', verifyfyToken, async (req, res) => {
    try {
      const { Emp_Id, co_name, type, place, email, password } = req.body;
  
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const new_emp = new employerSchema({
        Emp_Id,
        co_name,
        type,
        place,
        email,
        password: hashedPassword,
      });
  
      await new_emp.save();
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Employer Account Details',
        text: ` Hello Employer welcome to Entrylaunch. Your account has been created with the following details:
        - Employer ID: ${Emp_Id}
        - Company Name: ${co_name}
        - Place: ${place}
        - Type of Company: ${type}
        - Email: ${email}
        - Password: ${password}
Login to your profile using this email id and password`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(201).json({ message: 'Added new employer and email sent.' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
// view employer

router.get('/get-employers',verifyfyToken, async (req, res) => {
    try {
        const employer = await employerSchema.find();
        res.status(200).json(employer);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});


// getting the selected id to the table

router.get('/employers',verifyfyToken, async (req, res) => {
    try {
        const employers = await employerSchema.find(); // Fetch all employers
        if (employers.length > 0) {
            res.status(200).json(employers);
        } else {
            res.status(404).json({ message: "No employers found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


// removeing employer by admin

router.delete('/delete/:id',verifyfyToken,async (req, res) => {
    try {
        const employerID = req.params.id;
        const result = await employerSchema.deleteOne({ Emp_Id: employerID });

        if (result.deletedCount > 0) {
            res.status(200).json({ message: "Employer deleted successfully" });
        } else {
            res.status(404).json({ message: "Employer not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});






module.exports = router;
