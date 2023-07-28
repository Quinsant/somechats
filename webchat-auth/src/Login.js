import { Stack } from "@mui/system";
import { Avatar,Button, Chip, CircularProgress, Grid, IconButton, TextField} from '@mui/material';
import React from "react";
import axios from "axios";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default class Login extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            checkUser: false,
            showPassword: "password",
            login: "",
            password: "",
            load: false,
            errorPassowrd: false,
            errorPasswordMessage: ""
        }
    }
    handleInputChangePassword = (event) => {
        event.persist();
        const value = event.target.value.replace(/[^A-Za-z0-9\W]/ig, '');
        this.setState({password: value, errorPassowrd: false, errorPasswordMessage: false})
    }
    handleCheckUser = (event) => {
        event.persist();
        let value = event.target.value.replace(/[^A-Za-z0-9]/ig, '');
        this.setState({[event.target.name]: value})
        if(value !== ""){
            const data = {login: value}
            axios({method: 'POST', url: `${document.location.pathname}/check`, data: data, headers: {'Content-Type': 'application/json'}}).then((response) => {
                switch (response.data.nickname) {
                    case null: this.setState({checkUser: false})
                        break;
                    default:
                        this.setState({checkUser: true, nickname: response.data.nickname, 
                            avatar: response.data.avatar})
                        break;
                }
            })
        }
    }

    btnShowPassword = () => {
        if(this.state.showPassword === "password") this.setState({showPassword: "text"});
        else this.setState({showPassword: "password"});
    }
    handleButtonSubmit = (event) => {
        this.setState({load: true});
        event.preventDefault();
        let state = this.state;
        const data = {login: state.login, password: state.password}

        axios({method: 'POST', url: `${document.location.pathname}/login`, data: data, headers: {'Content-Type': 'application/json'}}).then((response) => {
            if (response.data.success) {
                this.setState({load: false});
                document.location.reload();
            }
            else this.setState({errorPassowrd: true, errorPasswordMessage: "Неверный пароль!", load: false});
        })
    }
    render() {
        const state = this.state;
        return (
            <Grid container direction="column" justifyContent="center" alignItems="stretch">
                {
                    state.checkUser ? <Stack direction="row" justifyContent="center" alignItems="center" sx={{mb: '20px'}} spacing={2}>
                    <Chip variant="outlined" color="primary" sx={{borderWidth: "2px", fontSize: 15, height: 42, pl: 1, pr: 1}}
                        label={state.nickname} avatar={
                            state.avatar === null ? <Avatar style={{width: 32, height: 32}} sx={{color: "white"}} /> :
                            <Avatar style={{width: 32, height: 32}} src={`${document.location.origin}/avatar/${state.avatar}`}/>
                        }
                    /></Stack> : <></>
                }
                <form onSubmit={this.handleButtonSubmit}><Stack direction="column" justifyContent="center" alignItems="stretch" spacing={3}>
                    <TextField label="Логин" variant="outlined" type={"text"}  name={"login"} onChange={this.handleCheckUser} value={state.login}/>

                    <TextField label="Пароль" variant="outlined" name={"password"} onChange={this.handleInputChangePassword} 
                    type={state.showPassword} InputProps={{endAdornment: <IconButton onClick={this.btnShowPassword}
                    children={state.showPassword === "password" ? <Visibility /> : <VisibilityOff />} />}} value={state.password}
                    error={state.errorPassowrd} helperText={state.errorPasswordMessage}/>
                    {
                        state.load ? <CircularProgress sx={{alignSelf: "center"}} /> : 
                        <Button variant="contained" disabled={!state.checkUser} type="submit">Войти</Button>
                    }
                    
                </Stack></form>
            </Grid>
        )
    }
}
