import { AppBar, Avatar, Button, Card, CardActions, CardContent, CardMedia, Chip, Grid, IconButton, Stack, Tab, Tabs, TextField, Toolbar, Typography } from "@mui/material"
import React from "react"
import { TabPanel, a11yProps} from "./modules"
import CancelIcon from '@mui/icons-material/Cancel';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import NotificationAddIcon from '@mui/icons-material/NotificationAdd';
import axios from "axios";
import { useState } from "react";
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from "react-router-dom";

function CardUser(props) {
    let avatar = props.avatar === null ? undefined : `${document.location.origin}/avatar/${props.avatar}`;
    const [snack, setSnack] = useState({text: "", type: 'info', icon: undefined, open: false});

    const addNotice = () => {
        const data = {
            id: props.id
        }
        axios({method: 'POST', url: `${document.location.href}/addnotice`, data: data, headers: {'Content-Type': 'application/json'}})
            .then((response) => {
                console.log(response.data);
                if(response.data.success) {
                    setSnack({text: "Заявка отправлена!", type: 'info', icon: <NotificationAddIcon />, open: true})
                }
                else {
                    setSnack({text: `${props.nickname} добавлен в друзья!`, type: 'info', icon: <PersonAddIcon />, open: true})
                }

            }).catch(() => {console.error("Request failed!")});
    }

    const rmNotice = () => {
        const data = {
            id: props.id
        }
        axios({method: 'POST', url: `${document.location.origin}/home/notices/rmnotice`, data: data, headers: {'Content-Type': 'application/json'}})
            .then((response) => {
                if(response.data.success) {
                    setSnack({text: `${props.nickname} удален из друзей!`, type: 'info', icon: <PersonRemoveIcon />, open: true})
                }

            }).catch(() => {console.error("Request failed!")});
    }

    const rmFriend = () => {
        axios({method: 'POST', url: `${document.location.origin}/home/friends/rmfriend`, data: {id: props.id}, headers: {'Content-Type': 'application/json'}})
        .then((response) => {
            if(response.data.success) {
            }

        }).catch(() => {console.error("Request failed!")});
    }


    return (
        <Card sx={{width: 300, pb: 1}} elevation={3} itemID={props.id}>
            <CardContent>
                <Stack direction="column" justifyContent="center" alignItems="center" spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" width={"100%"} >
                    {
                        props.online ? <Chip label={<Stack direction="row" justifyContent="center" alignItems="center">
                            <FiberManualRecordIcon fontSize="10" />Online
                        </Stack>} color="success" variant="outlined" /> :
                        <Chip label={<Stack direction="row" justifyContent="center" alignItems="center">
                            <FiberManualRecordIcon fontSize="10" />Offline
                        </Stack>} color="error" variant="outlined" />
                    }
                    <Typography children={`@${props.login}`} fontSize={16} color="secondary" />
                    </Stack>
                    <Avatar sx={{width: 75, height: 75}} src={avatar} />
                    <Typography color={"primary"} children={`${props.nickname}`} variant="h5" component={"label"}  />
                </Stack>
            </CardContent>
            <CardActions sx={{justifyContent: "center"}}>
                {
                    props.wheres === "all" ? <Button variant="contained" color="secondary" startIcon={<PersonAddIcon />} children={"Добавить"} onClick={addNotice} /> : 
                    props.wheres === "notice" ? <Button variant="contained" color="secondary" startIcon={<CancelIcon />} onClick={rmNotice} children={"Отменить заявку"} /> :
                    props.wheres === "friend" ? <Button variant="contained" color="secondary" startIcon={<PersonRemoveIcon />} onClick={rmFriend} children={"Удалить из друзей"} /> : <></>
                    
                }
            </CardActions>
        </Card>

    )
}

// function CardRoom() {

//     return (
//         <Card sx={{width: 300, pb: 1}} elevation={3}>
//             <CardMedia component={"img"} src={null} height={"140px"} sx={{outline: "none"}} />
//             <CardContent>
//                 <Stack direction="column" justifyContent="center" alignItems="center" spacing={1}>
//                     <Typography color={"primary"} children={"dsds"} variant="h5" component={"label"}  />
//                     <Typography children={"fdf"} variant="body2" />
//                 </Stack>
//             </CardContent>
//             <CardActions sx={{justifyContent: "center"}}>
//                 <Button variant="contained" color="secondary" startIcon={<AddIcon />} children={"Присоединиться"} />
//             </CardActions>
//         </Card>
//     )
// }

export default class Search extends React.Component {
    constructor(props) {
        super(props)
        this.setState = this.setState.bind(this);
        this.state = {
            tab: 0,
            value: "",
            content: null,
            controller: axios.CancelToken.source(),
        }
    }
    getCardUser = () => {
        if(this.state.value == "") this.setState({content: null});
        else {        
            if(this.state.tab === 0) {
                axios({method: 'POST', url: `${document.location.href}/people`, data: {value: this.state.value}, headers: {'Content-Type': 'application/json'}})
                .then((response) => {
                    if(response.data.length === 0) {
                        this.setState({content: null});
                    }
                    else this.setState({content: response.data});

                }).catch(() => {console.error("Request failed!")});
            };
        }
    }
    componentDidMount() {
        if(window.innerWidth < 600) this.setState({mobile: true})
        else this.setState({mobile: false});
        this.interval = setInterval(this.getCardUser, 2750)
    }
    componentDidUpdate() {this.state.controller.cancel()}
    componentWillUnmount() {clearInterval(this.interval)}

    handleChangeTab = (event, newValue) => this.setState({tab: newValue});

    handleSearch = (event) => {
        const value = event.target.value;
        this.setState({value: value});
        if(this.state.value == "") {
            this.getCardUser();
        }
    }

    render() {
        const state = this.state;
        return (
            <Stack direction="column" justifyContent="center" alignItems="center" spacing={3}>
                <AppBar position="static" sx={{borderRadius: 15}} color={"inherit"}><Toolbar>
                        <Stack direction="row" justifyContent={state.mobile ? "space-between" : "flex-end"} alignItems="center" width={"100%"}>
                            {state.mobile ? <IconButton hidden={!state.mobile} component={Link} to={"/home"} children={<MenuIcon />} /> : <></>}
                            {/* <Tabs value={state.tab} onChange={this.handleChangeTab} aria-label="basic tabs example">
                                <Tab label="Люди" {...a11yProps(0)} />
                                <Tab label="Комнаты" {...a11yProps(1)} />
                            </Tabs> */}
                            <TextField placeholder="@id | псевдоним" onChange={this.handleSearch} value={state.value} />
                        </Stack>
                </Toolbar></AppBar>
                <TabPanel value={state.tab} index={0}>
                    <Grid container direction="row" justifyContent="center" alignItems="center" gap={2}>
                        {
                            state.content === null ? <Typography color={"secondary"} children={"Ничего не найдено!"} variant="p" /> : 
                            state.content.map((item) => {
                                return <CardUser id={item.id} avatar={item.avatar} nickname={item.nickname} 
                                    login={item.login} wheres={item.wheres} online={item.online}  />
                            })
                        }
                    </Grid>
                </TabPanel>
                {/* <TabPanel value={state.tab} index={1}>
                    <Grid container direction="row" justifyContent="center" alignItems="center" sx={{overflow: "auto"}}>
                       
                    </Grid>
                </TabPanel> */}

            </Stack>
        )
    }
}