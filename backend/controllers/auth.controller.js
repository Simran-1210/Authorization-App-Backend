import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/emails.js";

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    console.log("signup",req.body);
    try {
        // Check if all fields are provided
        if (!email || !password || !name) {
            throw new Error("All fields are required");
        }

        // Check if the user already exists
        const userAlreadyExists = await User.findOne({ email });
        console.log("userAlreadyExists",userAlreadyExists);


        if (userAlreadyExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Hash the password

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Create new user instance
        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpires: Date.now() + 24* 60 * 60 * 1000, // Expires in 1 hour
        });

        // Save the user to the database
        await user.save();

        // Generate token and set it in cookies
        //jwt
        generateTokenAndSetCookie(res, user._id);

        await sendVerificationEmail(user.email, verificationToken);

        // Send success response
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc,
                password: undefined, // Do not send the password back
            }
        })
    } catch (error) {
        // Handle errors
         res.status(400).json({ success: false, message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
   //1 2 3 4 5 6
   const {code} = req.body;
   try{
    const user = await User.findOne({
        verificationToken: code,
        verificationTokenExpires: {$gt: Date.now()}
    })

    if(!user){
        return res.status(400).json({success: false, message: "Invalid or expired verification code"})
    }  
    
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
        success: true,
        message: "Email verified successfully",
        user: {
        ...user._doc,
        password: undefined
    },
});
   }catch(error){
    console.log("error in verifyEmail",error);
    res.status(500).json({success: false, message: "Server error"});
   }
};

export const login = async (req, res) => {
   const { email, password } = req.body;

   try{
    const user= await User.findOne({email});
    if(!user){
        return res.status(400).json({success: false, message: "Invalid credentials"});
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if(!isPasswordValid){
        return res.status(400).json({success: false, message: "Invalid credentials"});
    }

    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
        success: true,
        message: "Logged in successfully",
        user: {
            ...user._doc,
            password: undefined,
        },
    });
   }
    catch(error){
     console.log("error in login",error);
     res.status(400).json({success: false, message: error.message});
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });

};

export const forgotPassword = async (req, res) => {
    const { email } = req.body; 
    try{
        const user= await User.findOne({email});
 
        if(!user){
            return res.status(400).json({success: false, message: "User not found"});
        }

        //Generate a reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60* 1000; // Expires in 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;   
        
        await user.save(); //Update the database

        //send email
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

        res.status(200).json({success: true, message: "Password reset link sent to your email"});

    }catch(error){
        console.log("Error in forgotPassword",error);
        res.status(400).json({success: false, message: error.message});
    }
}

export const resetPassword = async (req, res) => {
    try{
        const {token}= req.params;
        console.log(token);
        const {password} = req.body;
        console.log(password);

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() }, // Token should not be expired
        });

        console.log("user",user);
        if(!user){
            return res.status(400).json({success: false, message: "Invalid or expired token"});
        }

        //update password
        const hashedPassword = await bcryptjs.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();  //Update the database

        await sendResetSuccessEmail(user.email);
        // await sendResetSuccessEmail(user.email, resetURL);


        res.status(200).json({success: true, message: "Password reset successful"});
    }catch(error){
        console.log("Error in resetPassword ok ",error);
        res.status(400).json({success: false, message: error.message});
    }
}

export const checkAuth = async (req, res) => {
    try{
        const user = await User.findById(req.userId).select("-password");
        if(!user){
            return res.status(400).json({success: false, message: "User not found"});
        }

        res.status(200).json({success: true, user});

    }catch(error){
        console.log("Error in checkAuth",error);
        res.status(400).json({success: false, message: error.message});
    }
}