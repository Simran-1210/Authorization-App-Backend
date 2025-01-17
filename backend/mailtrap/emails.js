import { PASSWORD_RESET_REQUEST_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE} from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.config.js"; // Correct import

export const sendVerificationEmail = async (email, verificationToken) => {
    const recipient = [{ email }];

    try {
        // Use mailtrapClient here, not MailtrapClient
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification",
        });

        console.log("Verification email sent successfully", response);
    } catch (error) {
        console.log(`Error sending verification email:`, error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

export const sendWelcomeEmail = async (email,name) => {
    const recipient = [{ email }];

    try{

        const response= await mailtrapClient.send({
            from: sender,
            to: recipient,
            template_uuid: "55e649f7-803b-4ed1-8928-dff1187e780e",
            template_variables: {
                "company_info_name": "Auth Company",
                "name": name,
            },
        });

        console.log("Welcome email sent successfully", response);
    }  catch(error){
        console.log(`Error sending welcome email`, error);
        throw new Error(`Error sending welcome email: ${error}`);
    }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
    const recipient = [{ email }];

    try{
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Reset your Password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Password Reset",
        });

        // console.log("Password reset email sent successfully", response);
    }catch(error){
        console.log(`Error sending password reset email`, error);

        throw new Error(`Error sending password reset email: ${error}`);
    }
};

export const sendResetSuccessEmail= async(email) => {
    const recipient = [{ email }];

    try{
        const response= await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset",
        });

        console.log("Password reset email sent successfully", response);
    }catch(error){
        console.error(`Error sending password reset success email`, error);

        throw new Error(`Error sending password reset success email: ${error}`);
    }
};



