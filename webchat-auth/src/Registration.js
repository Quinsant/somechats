import { Stack } from "@mui/system";
import { Button, CircularProgress, IconButton, TextField} from '@mui/material';
import React from "react";
import axios from "axios";
import { passwordStrength } from "check-password-strength";
import { Visibility, VisibilityOff } from "@mui/icons-material";

function check_password(password) {
    switch (passwordStrength(password).value) {
        case "Too weak":
            return {code: true, textPassword: "Пароль (простой)"}
        case ("Weak" || "Medium" || "Strong"):
            return {code: false, textPassword: "Пароль"}
        default:break;
    }
}


export default class Registration extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            login: "",
            inputPassword: false,
            password: "",
            repassword: "",
            load: false,
            textPassword: "Пароль",
            errorMessageRepassword: "",
            errorPassword: false,
            errorRepassword: false,
            errorMessageEmail: "",
            errorMessageLogin: "",
            errorEmail: false,
            errorLogin: false,
            showRepassword: "password",
            showPassword: "password"
        }
    }
    handleInputChange = (event) => {
        event.persist();
        const state = this.state
        const name = event.target.name;
        let value = event.target.value.replace(/[^A-Za-z0-9\W]/ig, '');
        switch (name) {
            case "repassword":
                if(value !== state.password)
                    this.setState({[name]: value, errorMessageRepassword: "Пароли не совпадают!", errorRepassword: true});
                else this.setState({[name]: value, errorMessageRepassword: "", errorRepassword: false});

                break;
            case "password":
                let cp = check_password(value);
                this.setState({password: value, textPassword: cp.textPassword, errorPassword: cp.code, errorMessageRepassword: ""})
                if(value === "") this.setState({textPassword: "Пароль", errorPassword: false})
                if(value !== state.repassword) this.setState({[name]: value, errorMessageRepassword: "Пароли не совпадают!", errorRepassword: true});
                else this.setState({[name]: value, errorMessageRepassword: "", errorRepassword: false});
                break;
            case "login":
                value = value.replace(/[^A-Za-z0-9]/ig, '');
                if(value === "") this.setState({[name]: value, errorLogin: true, errorMessageLogin: "Обязательно для заполнения!"});
                else this.setState({[name]: value, errorLogin: false, errorMessageLogin: ""});
                break
            default:
                this.setState({[name]: value, errorEmail: false,  errorMessageRepassword: "", errorRepassword: false, errorPassword: false, errorMessageEmail: ""});
                break;
        }
    }
    btnShowPassword = () => {
        if(this.state.showPassword === "password") this.setState({showPassword: "text"});
        else this.setState({showPassword: "password"});
    }

    btnShowRepassword = () => {
        if(this.state.showRepassword === "password") this.setState({showRepassword: "text"})
        else this.setState({showRepassword: "password"})
    }

    handleButtonSubmit = (event) => {
        event.preventDefault();
        this.setState({load: true});
        let state = this.state;

        const data = {login: state.login, email: state.email, password: state.password}
        axios({method: 'POST', url: `${document.location.pathname}/signup`, data: data, headers: {'Content-Type': 'application/json'}}).then((response) => {
            if(response.data.success) {
                this.setState({load: false});
                document.location.reload();
            }
            else {
                this.setState({errorLogin: true, errorMessageLogin: "Пользователь с таким логином уже существует!", load: false})
            }
            
        })
        
    }

    inputPassword = () => {
        if(this.state.inputPassword) this.setState({inputPassword: false});
        else this.setState({inputPassword: true});
    }

    render() {
        const state = this.state
        return (
            <form onSubmit={this.handleButtonSubmit}><Stack direction="column" justifyContent="center" alignItems="stretch" spacing={3}>

                <TextField label="Логин" variant="outlined" type={"text"} inputMode={"text"} onChange={this.handleInputChange} required
                 error={state.errorLogin} helperText={state.errorMessageLogin} name="login" value={state.login}/>

                
                <TextField label={state.textPassword} error={state.errorPassword} variant="outlined" type={state.showPassword} 
                    name={"password"} onChange={this.handleInputChange} required InputProps={{endAdornment: <IconButton onClick={this.btnShowPassword}
                    children={state.showPassword === "password" ?  <Visibility /> : <VisibilityOff />} />}} value={state.password}/>

                <TextField label="Повтор пароля" variant="outlined" name={"repassword"} onChange={this.handleInputChange} required type={state.showRepassword}
                    helperText={state.errorMessageRepassword} error={state.errorRepassword}  InputProps={{endAdornment: <IconButton onClick={this.btnShowRepassword}  
                    children={state.showRepassword === "password" ? <Visibility /> : <VisibilityOff />} />}} value={state.repassword}/>


                {state.load ? <CircularProgress sx={{alignSelf: "center"}}/> : 
                    <Button variant="contained" type="submit">Зарегистрироваться</Button>}

            </Stack></form>
        )
    }
}


