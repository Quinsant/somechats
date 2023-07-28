import { Alert, Avatar, Container, IconButton, Snackbar, Stack, TextField, Tooltip, Divider, ToggleButtonGroup, ToggleButton, Chip, Typography, Badge, Button, ButtonGroup, Tabs, Tab, CircularProgress } from "@mui/material";
import React from "react";
import DoneIcon from '@mui/icons-material/Done';
import Brightness1Icon from '@mui/icons-material/Brightness1';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import ReplayIcon from '@mui/icons-material/Replay';
import HideImageIcon from '@mui/icons-material/HideImage';
import InvertColorsOffIcon from '@mui/icons-material/InvertColorsOff';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import cookie from 'cookie_js';
import axios from "axios";
import { URL_SET } from ".";
import { TabPanel, a11yProps, check_password } from "./modules";

export default class DialogSettings extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            newAvatar: "",
            newAvatarUrl: undefined,
            loadImg: false,
            snbr: false,
            snbrType: "info",
            snbrText: "",
            themeSys: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
            theme: cookie.get("theme") !== undefined ? JSON.parse(cookie.get("theme")).mode : "",
            setNick: false,
            newNick: "",
            tab: 0,
            showOldPassword: "password",
            showNewPassword: "password",
            oldPassword: "",
            newPassword: "",
            errorPassword: "Новый пароль",
            activePassword: true,
            oldPasswordError: "",
        }
    }
    uploadAvatar = (event) => {
        let file = event.target.files[0];
        const setState = (s) => this.setState(s);

        if (file) {

          let reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = function() {
            setState({newAvatar: file, newAvatarUrl: reader.result})
            reader.abort();
          };
        
          reader.onerror = function() {
            setState({snbr: true, snbrType: "error", snbrText: "Ошибка загрузки изображения!"})
          };
        }
    }

    btnShowOldPassword = () => {
        if(this.state.showOldPassword === "password") this.setState({showOldPassword: "text"});
        else this.setState({showOldPassword: "password"});
    }
    btnShowNewPassword = () => {
        if(this.state.showNewPassword === "password") this.setState({showNewPassword: "text"});
        else this.setState({showNewPassword: "password"});
    }

    handleSetAvatar = () => {
        this.setState({loadImg: true});
        let data = new FormData();
        data.append("value", this.state.newAvatar)

        axios({method: 'POST', url: `${URL_SET}/avatar`, data: data, headers: {'Content-Type': 'multipart/form-data'}})
        .then((response) => {
            if(response.data.success) this.setState({snbr: true, snbrType: "success", snbrText: "Аватар обновлен!", newAvatar: "", newAvatarUrl: undefined})
            else this.setState({snbr: true, snbrType: "error", snbrText: "Ошибка загрузки изображения (не более 15Mb)!"});
            this.setState({loadImg: false});
        })
    }
    
    handleChange= (event) => {
        const name = event.target.name;
        const value = event.target.value;
        switch (name) {
            case "nickname":
                this.setState({newNick: value})
                break;
            default:
                break;
        }
    }
    handleSubmitNick = (event) => {
        event.preventDefault();
        const value = this.state.newNick;
        if((value !== "") && (value !== this.props.nickname)) {
            const data = {value: value};
            axios({method: 'POST', url: `${URL_SET}/nickname`, data: data, headers: {'Content-Type': 'application/json'}})
            .then((response) => {
                if(response.data.success) {
                    this.setState({snbr: true, snbrType: "success", snbrText: "Псевдоним обновлен!", setNick: false})
                }
            })
        }
        else this.setState({setNick: false})
    }

    handleCancelAvatar = () => this.setState({newAvatar: "", newAvatarUrl: ""});

    handleCloseSnbr = () => this.setState({snbr: false});

    setNickFocus = () => this.setState({setNick: true});

    setTab = (event, newValue) => this.setState({tab: newValue});

    setTheme = (data) => {
        axios({method: 'POST', url: `${URL_SET}/theme`, data: data, headers: {'Content-Type': 'application/json'}})
    }

    handleSetMode = (event, newValue) => {
        let theme = JSON.parse(cookie.get("theme"));
        const new_theme = {
            mode: newValue,
            primary: theme.primary,
            secondary: theme.secondary,
        }
        this.setTheme(new_theme);
        this.setState({theme: newValue})
    };

    handleSetColor = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        let theme = JSON.parse(cookie.get("theme"));
   
        switch (name) {
            case "primary": {
                let new_theme = {
                    mode: theme.mode,
                    primary: value,
                    secondary: theme.secondary,
                }
                this.setTheme(new_theme);
                break;
            };
            case "secondary": {
                let new_theme = {
                    mode: theme.mode,
                    primary: theme.primary,
                    secondary: value,
                }
                this.setTheme(new_theme);
                break;
            }
            default:
                break;
        }
    };

    handleResetTheme = () => {
        axios({method: 'POST', url: `${URL_SET}/retheme`, headers: {'Content-Type': 'application/json'}})
        cookie.remove("theme");
    };
    handleDelAvatar = () => {
        axios({method: 'POST', url: `${URL_SET}/delavatar`, headers: {'Content-Type': 'application/json'}})
    };

    handleChangeData= (event) => {
        let value = event.target.value;
        //if(event.target.name === "new_email") this.setState({newEmail: value});
        //else {
            value = value.replace(/[^A-Za-z0-9$@*&?!^%#"']/ig, '');

            switch (event.target.name) {
                case "old_password":
                    this.setState({oldPassword: value, activePassword: false})
                    break;
                case "new_password":
                    this.setState({newPassword: value})
                    if(value === "") this.setState({errorPassword: "Новый пароль", activePassword: true});
                    else {
                        let check = check_password(value);
                        if(check.code && value !== "") this.setState({errorPassword: check.textPassword, activePassword: true});
                        else this.setState({errorPassword: check.textPassword, activePassword: false});
                    }
                    break;
                default:
                    break;
            }
       // }
    }
    handleRePassword = (event) => {
        event.preventDefault();
        this.setState({oldPasswordError: ""})
        if(!this.state.activePassword) {
            const data = {
                password: this.state.oldPassword,
                redata: this.state.newPassword,
            }
            axios({method: 'POST', url: `${URL_SET}/repassword`, data: data, headers: {'Content-Type': 'application/json'}}).then((response) => {
                if (response.data.success) {
                    this.setState({snbr: true, snbrType: "success", snbrText: "Пароль обновлен!", oldPassword: "", 
                        newPassword: "", activePassword: true});
                }
                else {
                    this.setState({oldPasswordError: response.data.answer})
                }
            })
        }
    }

    // handleReEmail = (event) => {
    //     event.preventDefault();
    //     this.setState({oldPasswordError: ""})
    //     if(!this.state.activePassword) {
    //         const data = {
    //             password: this.state.oldPassword,
    //             redata: this.state.newEmail,
    //         }
    //         axios({method: 'POST', url: `${URL_SET}/reemail`, data: data, headers: {'Content-Type': 'application/json'}}).then((response) => {
    //             if (response.data.success) {
    //                 this.setState({snbr: true, snbrType: "success", snbrText: "E-mail обновлен!", oldPassword: "", 
    //                     newEmail: "", activePassword: true});
    //             }
    //             else {
    //                 this.setState({snbr: true, snbrType: "error", snbrText: response.data.answer, oldPassword: "", activePassword: true});
    //             }
    //         })
    //     }
    // }

    render() {
        const state = this.state;
        const props = this.props;
        return (
            <>
                <Container maxWidth={"lg"}>
                    <Stack direction="column" justifyContent="center" alignItems="center" spacing={2}
                    divider={<Divider orientation="horizontal" flexItem />}>
                        <Stack direction="column" justifyContent="center" alignItems="center" spacing={1}>
                            {
                            state.loadImg ? <CircularProgress sx={{ width: 75, height: 75 }} /> :
                            
                            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                {
                                    state.newAvatar !== "" ? <Tooltip title={"Применить"}>
                                        <IconButton onClick={this.handleSetAvatar} children={<DoneIcon color="primary" fontSize="large"/>} />
                                    </Tooltip> : <></>
                                }
                                <Tooltip title={"Установить изображение"}><IconButton component="label">
                                    <input hidden accept="image/*" type="file" dropzone="move" onChange={this.uploadAvatar}/>
                                    <Avatar src={props.avatar === null ? "" : `${document.location.origin}/avatar/${props.avatar}`} 
                                       sizes="large" sx={{ width: 75, height: 75 }} srcSet={state.newAvatarUrl}/>

                                </IconButton></Tooltip>
                                {
                                    state.newAvatar !== "" ? <Tooltip title={"Сбросить"}>
                                        <IconButton onClick={this.handleCancelAvatar} children={<ReplayIcon color="secondary" fontSize="large"/>} />
                                    </Tooltip> : <></>
                                }
                            </Stack>}
         
                            {
                                state.setNick ? <TextField label="Новый псевдоним" variant="filled" defaultValue={props.nickname}
                                name="nickname" autoFocus inputProps={{maxLength: "30"}} onChange={this.handleChange} InputProps={{endAdornment: 
                                <IconButton onClick={this.handleSubmitNick} children={ <DoneIcon color="secondary" />} />}} /> : 
                                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                <Tooltip title={`Изменить псевдоним`}><Chip label={props.nickname} onClick={this.setNickFocus} 
                                variant="outlined" color="primary" /></Tooltip>
                                <Tooltip title={`Удалить аватар`}><IconButton onClick={this.handleDelAvatar} 
                                children={<HideImageIcon color="secondary" />} /></Tooltip>
                                <Tooltip title={`Cбросить тему`}><IconButton onClick={this.handleResetTheme} 
                                children={<InvertColorsOffIcon color="secondary" />} /></Tooltip>
                                </Stack>
                            }

                        </Stack>
                    
                        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} >
                            <Tooltip title="Первичный цвет">
                                <IconButton component="label">
                                    <input hidden type="color" name="primary" onChange={this.handleSetColor} />
                                    <Brightness1Icon color="primary" sx={{ width: 35, height: 35 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Вторичный цвет">
                                <IconButton component="label">
                                    <input hidden type="color" name="secondary" onChange={this.handleSetColor} />
                                    <Brightness1Icon color="secondary" sx={{ width: 35, height: 35 }} />
                                </IconButton>
                            </Tooltip>
                            <ToggleButtonGroup value={state.theme} exclusive onChange={this.handleSetMode}>
                                <ToggleButton value="light" children={<LightModeIcon />} />
                                <ToggleButton value={state.themeSys} children={<SettingsBrightnessIcon />} />
                                <ToggleButton value="dark" children={<DarkModeIcon />} />
                            </ToggleButtonGroup>
                        </Stack>
          
                        <form onSubmit={this.handleRePassword}>
                            <Typography variant="body1" component={"span"} children={"Изменить пароль"} />
                            <Stack direction="column" justifyContent="center" alignItems="center" spacing={2} mt={1}>
                                <TextField required type={state.showOldPassword} error={state.oldPasswordError !== "" ? true : false}
                                    name="old_password" value={state.oldPassword} InputProps={{endAdornment: <IconButton onClick={this.btnShowOldPassword}
                                    children={state.showOldPassword === "password" ?  <Visibility /> : <VisibilityOff />} />}}
                                    label="Текущий пароль" onChange={this.handleChangeData} helperText={state.oldPasswordError} />

                                <TextField required type={state.showNewPassword} name="new_password" value={state.newPassword}
                                    label={state.errorPassword} onChange={this.handleChangeData} InputProps={{endAdornment: 
                                    <IconButton onClick={this.btnShowNewPassword} children={state.showNewPassword === "password"
                                    ?  <Visibility /> : <VisibilityOff />} />}} />
                                <Button variant="contained" disabled={
                                    state.oldPassword === "" || state.newPassword === "" || state.activePassword ? true : false
                                } color="secondary" type="submit">Обновить</Button>
                            </Stack>
                        </form>
                    </Stack>
                </Container>
                <Snackbar open={state.snbr} autoHideDuration={6000} onClose={this.handleCloseSnbr}>
                    <Alert onClose={this.handleCloseSnbr} severity={state.snbrType} sx={{ width: '100%' }}>
                        {state.snbrText}
                    </Alert>
                </Snackbar>
            </>

        )
    }
}