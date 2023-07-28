import { Avatar, Chip, Divider, List, ListItem, ListItemButton, ListItemText, Paper, Stack, Dialog, DialogContent, Typography, ListItemIcon, Container, Snackbar, Alert, IconButton, AppBar, Toolbar, Tooltip, Badge, ListItemAvatar, Hidden, SvgIcon} from "@mui/material";
import React from "react";
import { bg_grad, BootstrapDialogTitle,  StyledBadge2, SnackBarAlert } from "./modules";

import axios from "axios";
import DialogSettings from "./DialogSettings";


import Groups3Icon from '@mui/icons-material/Groups3';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LogoutIcon from '@mui/icons-material/Logout';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Notice from "./Notice";
import Search from "./Search";
import { Route, Routes, Link } from "react-router-dom";

import MenuIcon from '@mui/icons-material/Menu';
import Friends from "./Friends";
import Chats from "./Chats";

export default class MainMenu extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            dialog: false,
            data: this.props.data,
            controller: axios.CancelToken.source(),
            primary: "",
            secondary: "",
            snbr: false,
            snbrText: "",
            resize: false,
            mobile: false,
            btnResize: false,
        }
    }

    handleCloseSnbr = () => this.setState({snbr: false});

    update = () => {
        const data = this.props.data;
        const theme = data.theme;
        if(this.state.data.notices < data.notices) this.setState({snbr: true, snbrText: "У вас новое уведомление!"})
        if(((theme.primary !== this.state.primary) || (theme.secondary !== this.state.secondary)) && document.location.pathname  === "/home" ) {
            this.setState({primary: theme.primary, secondary: theme.secondary});
        }
        this.setState({data: data})
    }

    componentDidMount() { 
        this.update();
        this.interval = setInterval(this.update, 1)
        if(window.innerWidth <= 1450 && window.innerWidth >= 600) this.setState({resize: true, btnResize: true});
        else this.setState({btnResize: false});
        if(window.innerWidth < 600) this.setState({mobile: true})
        else this.setState({mobile: false});

        const main = this;
        window.addEventListener("resize", function () {
            if(window.innerWidth <= 1450 && window.innerWidth >= 600) main.setState({resize: true,  btnResize: true});
            else main.setState({resize: false, btnResize: false});
            if(window.innerWidth < 600) main.setState({mobile: true});
            else main.setState({mobile: false});
        })
    }
    componentDidUpdate() {this.state.controller.cancel()}
    componentWillUnmount() {clearInterval(this.interval)}

    handleOpenDialog = () => this.setState({dialog: true});
    handleCloseDialog = () => this.setState({dialog: false});

    exitHandler = () => {
        axios({method: 'POST', url: `${document.location.origin}/home/exit`,  headers: {'Content-Type': 'application/json'}}).then((response) => {
            if (response.data.success) document.location.reload();
        })
    }

    resizeMenu = () => {
        if(this.state.resize) this.setState({resize: false})
        else this.setState({resize: true})
    }

    render() {
        const state = this.state;
        const data = state.data;
        if(state.mobile) {
            return(<> 
                <Routes>
                    <Route index path="/home" element={<>
                        <AppBar className={"menu"} elevation={0} position="static" color={"inherit"}>
                            <List sx={{width: 'auto', overflowY: "auto"}}>
                                <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mt={2} mb={2}>
                                    <img src={`${document.location.origin}/static/icon.svg`} alt="logo" width={"55px"} height={"55px"} />
                                    <Typography variant="h5" component={"h1"} children={"Some Chats"} fontWeight={"bold"} m={0} translate={"no"} />
                                </Stack>
        
                                <Divider />
                                <Stack direction="column" justifyContent="center" alignItems="center" spacing={2} mb={3} mt={3}>
                                    <Avatar src={data.avatar === null ? "": `${document.location.origin}/avatar/${data.avatar}`} 
                                        sx={{width: "4.25em", height: "4.25em"}} />
                                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                        {this.props.online ? <Chip label={<Stack direction="row" justifyContent="center" alignItems="center">
                                        <FiberManualRecordIcon fontSize="10" />Online</Stack>} color="success" variant="outlined" /> :
                                        <Chip label={<Stack direction="row" justifyContent="center" alignItems="center">
                                        <FiberManualRecordIcon fontSize="10" />Offline
                                        </Stack>} color="error" variant="outlined" />}
                                        <Typography children={`${data.nickname}`} color="primary" fontWeight={"bold"} variant="h6" component={"label"} />
                                    </Stack>
                                </Stack>
        
                                <ListItem>
                                    <ListItemButton component={Link} to="/home/chats">
                                        <ListItemIcon children={<ChatIcon color="primary" />} />
                                        <ListItemText primary="Чаты" />
                                    </ListItemButton>
                                </ListItem>
                                
                                <ListItem>
                                    <ListItemButton component={Link} to="/home/friends">
                                        <ListItemIcon children={<Groups3Icon color="primary" />} />
                                        <ListItemText primary="Друзья" />
                                    </ListItemButton>
                                </ListItem>
        
                                <Divider />
                                <ListItem>
                                    <ListItemButton component={Link} to="/home/notices">
                                        <ListItemIcon children={<NotificationsIcon color="primary" />} />
                                        <ListItemText primary="Уведомления" />
                                        {
                                            data.notices === 0 ? <></> : <Chip label={data.notices}  color="secondary" size="small"/>
                                        }
                                    </ListItemButton>
                                </ListItem>
        
                                <ListItem>
                                    <ListItemButton component={Link} to="/home/search">
                                        <ListItemIcon children={<PersonSearchIcon color="primary" />} />
                                        <ListItemText primary="Поиск" />
                                    </ListItemButton>
                                </ListItem>
        
                                <Divider />
                                <ListItem>
                                    <ListItemButton onClick={this.handleOpenDialog}>
                                        <ListItemIcon children={<SettingsIcon color="primary" />} />
                                        <ListItemText primary="Настройки" />
                                    </ListItemButton>
                                </ListItem>
        
                                <ListItem>
                                    <ListItemButton onClick={this.exitHandler}>
                                        <ListItemIcon children={<LogoutIcon color="error" />} />
                                        <ListItemText primary="Выход"/>
                                    </ListItemButton>
                                </ListItem>
                            </List>
                        </AppBar>
                        <Dialog onClose={this.handleCloseDialog} open={state.dialog} aria-labelledby="dialog" maxWidth={"sm"}>
                        <BootstrapDialogTitle id={data.login} title="Параметры" onClose={this.handleCloseDialog} />
                        <DialogContent children={<DialogSettings avatar={data.avatar} email={data.email} nickname={data.nickname} />} />
                        </Dialog>
                        </>
                    } />

                    <Route path="/home/notices" element={<Paper elevation={0} className={"content"} square 
                    children={<Container maxWidth="xl" className="block-content" children={<Notice /> } />} />} />

                    <Route path="/home/search" element={<Paper elevation={0} className={"content"} square 
                    children={<Container maxWidth="xl" className="block-content" children={<Search /> } />} />} />

                    <Route path="/home/friends" element={<Paper elevation={0} className={"content"} square 
                    children={<Container maxWidth="xl" className="block-content" children={<Friends /> } />} />} />

                    <Route path="/home/chats/*" element={<Paper elevation={0} className={"content"} square 
                    children={<Container maxWidth="xl" className="block-content" children={<Chats /> } />} />} />
                </Routes>
                <SnackBarAlert open={state.snbr} type={'info'} icon={<NotificationsActiveIcon fontSize="inherit" />} text={state.snbrText} />
            </>)
        }
        else return (<>
            <Stack direction="row" justifyContent="flex-start" alignItems="center" spacing={0} >
                <AppBar className={"menu"} sx={{width: state.resize ? "auto" : '18em'}} elevation={0} position="static" color={"inherit"}>
                    <List sx={{width: 'auto', overflowY: "auto"}}>
                        {
                            state.btnResize ? <></> : <ListItem sx={{mb: 2}}><IconButton children={<MenuIcon />} onClick={this.resizeMenu} /></ListItem>
                        }
                        {
                            state.resize ? 
                            <ListItem sx={{mb: 2, mt: state.btnResize ? 5 : 0}}><ListItemIcon>
                                <img src={`${document.location.origin}/static/icon.svg`} alt="logo" width={"40px"} height={"40px"} /> 
                            </ListItemIcon></ListItem> :
                            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mb={5}>
                                <img src={`${document.location.origin}/static/icon.svg`} alt="logo" width={"55px"} height={"55px"} />
                                <Typography variant="h5" component={"h1"} children={"Some Chats"} fontWeight={"bold"} m={0} translate={"no"} />
                            </Stack>
                        }

                        <Divider />
                        {
                            state.resize ? 
                            <ListItem sx={{mt: 3}}><ListItemAvatar>
                                <Tooltip title={`${data.nickname}`}>
                                    {
                                        this.props.online ? <StyledBadge2 variant="dot" color={"success"}>
                                            <Avatar src={data.avatar === null ? "": `${document.location.origin}/avatar/${data.avatar}`} />
                                        </StyledBadge2> :
                                        <Avatar src={data.avatar === null ? "": `${document.location.origin}/avatar/${data.avatar}`} />
                                    }
                                </Tooltip>
                                
                            </ListItemAvatar></ListItem> :
                        
                            <Stack direction="column" justifyContent="center" alignItems="center" spacing={2} mb={3} mt={3}>
                                <Avatar src={data.avatar === null ? "": `${document.location.origin}/avatar/${data.avatar}`} 
                                    sx={{width: "4.25em", height: "4.25em"}} />

                                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                    {
                                        this.props.online ? <Chip label={<Stack direction="row" justifyContent="center" alignItems="center">
                                            <FiberManualRecordIcon fontSize="10" />Online
                                            </Stack>} color="success" variant="outlined" /> :
                                        <Chip label={<Stack direction="row" justifyContent="center" alignItems="center">
                                            <FiberManualRecordIcon fontSize="10" />Offline
                                        </Stack>} color="error" variant="outlined" />
                                    }
                                    <Typography children={`${data.nickname}`} color="primary" fontWeight={"bold"} variant="h6" component={"label"} />
                                </Stack>
                            
                            </Stack>
                        }

                        <ListItem>{
                            state.resize ? 
                                <ListItemIcon children={ <Tooltip title={"Чаты"} children={   
                                <IconButton component={Link} to="/home/chats" children={<ChatIcon color="primary" />} />} />} /> :
                            <ListItemButton component={Link} to="/home/chats">
                                <ListItemIcon children={<ChatIcon color="primary" />} />
                                <ListItemText primary="Чаты" />
                            </ListItemButton>
                        }</ListItem>
                        
                        <ListItem>{
                            state.resize ? 
                                <ListItemIcon children={ <Tooltip title={"Друзья"} children={   
                                <IconButton component={Link} to="/home/friends" children={<Groups3Icon color="primary" />} />} />} /> :
                            <ListItemButton component={Link} to="/home/friends">
                                <ListItemIcon children={<Groups3Icon color="primary" />} />
                                <ListItemText primary="Друзья" />
                            </ListItemButton>
                        }</ListItem>

                        <Divider />
                        <ListItem>{
                            state.resize ?
                            <ListItemIcon children={<Tooltip title={"Уведомления"} children={
                                <IconButton component={Link} to="/home/notices" children={
                                    data.notices === 0 ? <NotificationsIcon color="primary" /> :
                                    <Badge badgeContent={data.notices} color="secondary" children={
                                    <NotificationsIcon color="primary" />} />} />
                                } />
                            } /> :
                            <ListItemButton component={Link} to="/home/notices">
                                <ListItemIcon children={<NotificationsIcon color="primary" />} />
                                <ListItemText primary="Уведомления" />
                                {
                                    data.notices === 0 ? <></> : <Chip label={data.notices}  color="secondary" size="small"/>
                                }
                            </ListItemButton>
                        }</ListItem>

                        <ListItem>{
                            state.resize ? 
                                <ListItemIcon children={<Tooltip title={"Поиск"} children={   
                                <IconButton component={Link} to="/home/search" children={<PersonSearchIcon color="primary" />} />} />} /> :

                            <ListItemButton component={Link} to="/home/search">
                                <ListItemIcon children={<PersonSearchIcon color="primary" />} />
                                <ListItemText primary="Поиск" />
                            </ListItemButton>
                        }</ListItem>

                        <Divider />
                        <ListItem>{
                            state.resize ? 
                                <ListItemIcon onClick={this.handleOpenDialog} children={<Tooltip title={"Настройки"} children={   
                                <IconButton children={<SettingsIcon color="primary" />} />} />} /> :

                            <ListItemButton onClick={this.handleOpenDialog}>
                                <ListItemIcon children={<SettingsIcon color="primary" />} />
                                <ListItemText primary="Настройки" />
                            </ListItemButton>
                        }</ListItem>

                        <ListItem>{
                            state.resize ? 
                                <ListItemIcon onClick={this.exitHandler} children={<Tooltip title={"Выход"} children={   
                                <IconButton children={<LogoutIcon color="error" />} />} />} /> :

                            <ListItemButton onClick={this.exitHandler}>
                                <ListItemIcon children={<LogoutIcon color="error" />} />
                                <ListItemText primary="Выход"/>
                            </ListItemButton>
                        }</ListItem>
                    </List>
                </AppBar>

                <Paper elevation={0} className={"content"} square> 
                    <Routes>
                        <Route index path="/home" element={
                            <Stack direction="column" justifyContent="flex-end" alignItems="center" spacing={0} width={"100vw"} height={"100vh"} className='bg-main'>
                                <SvgIcon width="100%" className="bg-svg" viewBox="0 0 1440 590" class="transition duration-300 ease-in-out delay-150">
                                    <defs><linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="5%" stop-color={state.primary}></stop><stop offset="95%" stop-color={state.secondary}></stop></linearGradient></defs><path d="M 0,600 C 0,600 0,200 0,200 C 109.73205741626793,235.54066985645935 219.46411483253587,271.0813397129187 301,268 C 382.53588516746413,264.9186602870813 435.87559808612446,223.2153110047847 528,208 C 620.1244019138755,192.7846889952153 751.0334928229664,204.05741626794259 872,201 C 992.9665071770336,197.94258373205741 1103.9904306220096,180.55502392344496 1197,178 C 1290.0095693779904,175.44497607655504 1365.0047846889952,187.7224880382775 1440,200 C 1440,200 1440,600 1440,600 Z" stroke="none" stroke-width="0" fill="url(#gradient)" fill-opacity="0.53" class="transition-all duration-300 ease-in-out delay-150 path-0"></path>
                                    <defs><linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="5%" stop-color={state.primary}></stop><stop offset="95%" stop-color={state.secondary}></stop></linearGradient></defs><path d="M 0,600 C 0,600 0,400 0,400 C 109.5885167464115,398.5263157894737 219.177033492823,397.0526315789474 316,395 C 412.822966507177,392.9473684210526 496.88038277511953,390.31578947368416 595,378 C 693.1196172248805,365.68421052631584 805.3014354066987,343.6842105263158 911,345 C 1016.6985645933013,346.3157894736842 1115.9138755980862,370.94736842105266 1203,384 C 1290.0861244019138,397.05263157894734 1365.043062200957,398.52631578947364 1440,400 C 1440,400 1440,600 1440,600 Z" stroke="none" stroke-width="0" fill="url(#gradient)" fill-opacity="1" class="transition-all duration-300 ease-in-out delay-150 path-1"></path>
                                </SvgIcon>
                            </Stack>
                        } />
                        <Route path="/home/notices" element={<Container maxWidth="xl" className="block-content" children={<Notice />} />} />
                        <Route path="/home/search" element={<Container maxWidth="xl" className="block-content" children={<Search />} />} />
                        <Route path="/home/friends" element={<Container maxWidth="xl" className="block-content" children={<Friends />} />} />
                        <Route path="/home/chats/*" element={<Container maxWidth="xl" className="block-content" children={<Chats />} />} />
                    </Routes>
                </Paper>
            </Stack>

            <Dialog onClose={this.handleCloseDialog} open={state.dialog} aria-labelledby="dialog" maxWidth={"sm"}>
                <BootstrapDialogTitle id={data.login} title="Параметры" onClose={this.handleCloseDialog} />
                <DialogContent children={<DialogSettings avatar={data.avatar} email={data.email} nickname={data.nickname} />} />
            </Dialog>
            <SnackBarAlert open={state.snbr} type={'info'} icon={<NotificationsActiveIcon fontSize="inherit" />} text={state.snbrText} />
            </>
        )
    }
}