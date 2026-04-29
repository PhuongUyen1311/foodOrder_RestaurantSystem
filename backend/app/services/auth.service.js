const bcrypt = require("bcrypt");
const authMethod = require("../middlewares/auth.method");
const jwtVariable = require("../../variables/jwt");
const { SALT_ROUNDS } = require("../../variables/auth");
const db = require("../models");

const Customer = db.customer;
const Admin = db.admin;

const login = async ({ email, password, page }) => {
    if (!email || !password || !page) {
        throw { status: 400, message: "Content cannot be empty!" };
    }

    const Model = page === "user" ? Customer : Admin;
    const data = await Model.findOne({ email });

    if (!data) {
        throw {
            status: 401,
            message:
                page === "user"
                    ? `Customer not found with email ${email}.`
                    : `Admin not found with email ${email}.`,
        };
    }

    if (page === "user" && data.is_active === false) {
        throw { status: 403, message: "Your account has been locked" };
    }

    const isPasswordValid = bcrypt.compareSync(password, data.hash_password);
    if (!isPasswordValid) {
        throw { status: 401, message: "Incorrect password." };
    }

    const payload = buildPayload(data, page);

    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    return { accessToken, refreshToken };
};

const register = async (data) => {
    const exist = await Customer.findOne({ email: data.email });

    if (exist) {
        throw {
            status: 401,
            message: `Customer already exists with email ${data.email}.`,
        };
    }

    if (data.password !== data.confirm_password) {
        throw { status: 400, message: "Confirm password does not match!" };
    }

    const hashPassword = bcrypt.hashSync(data.password, SALT_ROUNDS);

    const newCustomer = new Customer({
        email: data.email,
        hash_password: hashPassword,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        gender: data.gender,
    });

    return await newCustomer.save();
};

const refreshToken = async ({ refreshToken, page }) => {
    if (!refreshToken || !page) {
        throw { status: 400, message: "Missing data" };
    }

    const refreshTokenSecret =
        process.env.REFRESH_TOKEN_SECRET || jwtVariable.refreshTokenSecret;

    const decoded = await authMethod.decodeToken(
        refreshToken,
        refreshTokenSecret
    );

    if (!decoded) {
        throw { status: 400, message: "Invalid refresh token." };
    }

    const email = decoded.payload.email;

    const Model = page === "user" ? Customer : Admin;
    const user = await Model.findOne({ email });

    if (!user) {
        throw { status: 401, message: "User does not exist" };
    }

    const payload = buildPayload(user, page);

    const accessToken = await generateAccessToken(payload);

    return { accessToken };
};

const createAdmin = async (data) => {
    const exist = await Admin.findOne({ email: data.email });

    if (exist) {
        throw {
            status: 401,
            message: `Admin already exists with email ${data.email}.`,
        };
    }

    if (data.password !== data.confirm_password) {
        throw { status: 400, message: "Confirm password does not match!" };
    }

    const hashPassword = bcrypt.hashSync(data.password, SALT_ROUNDS);

    const newAdmin = new Admin({
        email: data.email,
        hash_password: hashPassword,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        gender: data.gender,
        role: data.role,
    });

    return await newAdmin.save();
};

const buildPayload = (data, page) => {
    return {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        avatar: data.avatar,
        role: page === "user" ? "user" : data.role,
    };
};

const generateAccessToken = async (payload) => {
    const secret =
        process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;
    const life =
        process.env.ACCESS_TOKEN_LIFE || jwtVariable.accessTokenLife;

    return await authMethod.generateToken(payload, secret, life);
};

const generateRefreshToken = async (payload) => {
    const secret =
        process.env.REFRESH_TOKEN_SECRET || jwtVariable.refreshTokenSecret;
    const life =
        process.env.REFRESH_TOKEN_LIFE || jwtVariable.refreshTokenLife;

    return await authMethod.generateToken(payload, secret, life);
};

module.exports = {
    login,
    register,
    refreshToken,
    createAdmin,
};