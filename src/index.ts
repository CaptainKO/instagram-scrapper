import * as inquirer from "inquirer";
import { Instagram } from "./instagram";

const questions = [
    {
        name: 'email',
        type: 'input',
        message: 'Type email',
    }, 
    {
        name: 'password',
        type: 'input',
        message: 'Type your password',
    },
    {
        name: 'username',
        type: 'input',
        message: 'Type your girl!!',
    },
    {
        name: 'isHeadless',
        type: 'confirm',
        message: 'Don you want to use headless chrome?',
        default: true
        
    }
];

const tasks = (async (answers: any) => {
    console.log('is downloading...');
    const {
        username, 
        email, 
        password,
        isHeadless
    } = answers;
    const ig = new Instagram();
    await ig.init({
        headless: isHeadless,
    }, { width: 1920, height: 1080 });

    if (email && password) {
     await ig.login(email, password);
    }

    await ig.downloadUserImages(username);
    await ig.close();
});
inquirer.prompt(questions).then(tasks);

