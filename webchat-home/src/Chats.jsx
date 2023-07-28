import { Paper, Stack, Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, ListItemButton, AppBar, Toolbar, TextField, IconButton, Tooltip, CircularProgress, Fab, Chip } from "@mui/material";
import React, { Component } from "react";
import SendIcon from '@mui/icons-material/Send';
import { Link } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import axios from "axios";
import MoreVertIcon from '@mui/icons-material/MoreVert';


export default class Chats extends Component {
    constructor(props) {
        super(props)
        this.state = {
            data: undefined,
            eventSource: new EventSource("/home/chats/all"),
            mobile: false,
            chat: null
        }
    }

    componentDidMount() {
        if(window.innerWidth < 600) this.setState({mobile: true})
        else this.setState({mobile: false});
        this.state.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if(data.length !== 0) {
                this.setState({data: data});
            }
            else this.setState({data: undefined});
        }
    }
    componentWillUnmount() {
        this.state.eventSource.close();
    }
    selectItem = (event) => {
        this.setState({chat: event.currentTarget.id});
    }
    ChatItem = (props) => {
        return (
            <Paper elevation={1} sx={{mb: 1}} children={
            <ListItemButton id={`${props.id}`}  alignItems="flex-start" sx={{borderRadius: 1}} onClick={this.selectItem} component={Link} to={`/home/chats/${props.id}`}>
                 <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{width: '100%'}}>
                    <ListItemAvatar sx={{mt: 0}} children={<Avatar alt={props.nickname} src={props.avatar === null ? "": `${document.location.origin}/avatar/${props.avatar}`} />} />
                    <ListItemText children={<Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{width: '100%'}} spacing={2}>
                        <Typography fontWeight={"bold"} component={"h2"} variant={"h6"} color={"secondary"} children={props.nickname} />
                        <Chip label={props.online ? "Online" : "Offline"} color={props.online ? "success" : "error"} variant="outlined" size="small" />
                    </Stack>} /> 
                </Stack>
            </ListItemButton>}/>
            // 
        )
    }

    render() {
        if(window.innerWidth < 960 && document.location.pathname === "/home/chats") 
            return (<Stack direction="column" justifyContent="center" alignItems="flex-start" spacing={3} sx={{width: '100%', height: "100%"}}>
                {this.state.mobile ? <Fab color="primary" size="small" children={<MenuIcon />} component={Link} to={"/home"} /> : <></>}
                <Box className="chat-menu">
                {/* this.state.data === undefined  */}
                    {this.state.data === undefined ? <Stack direction="column" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress color="primary" /></Stack> : <List sx={{width: "100%"}}>
                            {this.state.data.map((i) => {
                                if (i.type === "personal") {
                                    let id = i.id.replace("chats:", "");
                                    return <this.ChatItem nickname={i.nickname[0]} message={i.messages} avatar={i.avatar[0]} id={id} online={i.online[0]}  /> 
                                }

                            })}
                    </List>}
                </Box>
            </Stack>)
        else if(window.innerWidth < 960 && document.location.pathname !== "/home/chats")
            return (<Stack direction="column" justifyContent="center" alignItems="center" spacing={1} 
                    sx={{width: '100%', height: "100%"}}><Chat item={this.state.chat} /></Stack>)
        else return (
            <Stack direction="row" justifyContent="flex-start" alignItems="center" spacing={3} sx={{width: '100%', height: "100%"}}>
                <Box className="chat-menu">
                {/* this.state.data === undefined  */}
                    {this.state.data === undefined ? <Stack direction="column" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress color="primary" /></Stack> : <List sx={{width: "100%"}}>
                            {this.state.data.map((i) => {
                                if (i.type === "personal") {
                                    let id = i.id.replace("chats:", "");
                                    return <this.ChatItem nickname={i.nickname[0]} message={i.messages} avatar={i.avatar[0]} id={id} online={i.online[0]} /> 
                                }

                            })}
                    </List>}
                </Box>
                
                {
                    document.location.pathname === "/home/chats" ? <></> : <Stack direction="column" justifyContent="center" alignItems="center" spacing={1} 
                    sx={{width: '100%', height: "100%"}} ><Chat item={this.state.chat}/></Stack>
                }
                
            </Stack>
        )
    }
}
{/* <this.ChatItem nickname="test" message="test" avatar={null} type={} id={} /> */}
class Chat extends Component {
    constructor(props) {
        super(props)

        this.state = {
            idChat: "",
            mobile: false,
            messages: [],
            userData: undefined,
            load: true,
            value: "",
            meId: "",
            ws: null,
        }
    }

    timeout = 250;

    MessageItem = (props) => {
        return (
            <ListItem alignItems="flex-start" itemID={props.id}>
                <ListItemAvatar><Avatar alt={props.nickname} 
                src={props.avatar === null ? "": `${document.location.origin}/avatar/${props.avatar}`} /></ListItemAvatar>
                <ListItemText sx={{maxWidth: "auto"}} primary={<React.Fragment>
                    <Typography component={"h2"} variant="body1" color={props.me ? "primary" : "secondary"} children={props.nickname} />
                </React.Fragment>} secondary={
                    <React.Fragment>
                        <Stack direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={2}>
                            {`${props.message.text}`}
                        </Stack>
                    </React.Fragment>
                } />
            </ListItem>
        )
    }

    connect = async () =>  {
        const that = this;
        let connectInterval;
        await axios({method: 'POST', url: `${document.location.href}/get`, headers: {'Content-Type': 'application/json'}})
        .then((response) => {
            if(response.data.success) {
                console.log(response.data);
                this.setState({load: false, userData: response.data.data, meId: response.data.meId, messages: []})
            }
        })
        let ws = new WebSocket(`${document.location.protocol === "https:" ? "wss" : "ws"}://${document.location.hostname}:3300`)
        ws.onopen = (event) => {
            console.log(event);
            this.setState({ws: ws});
        }
        let messages = []
        ws.onmessage = (event) => {
            console.log(event);
            const data = JSON.parse(event.data);
            console.log(data);
            messages = messages.concat([data]);
            this.setState({messages: messages})
        }
        ws.onclose = e => {
            this.state({load: true});
            this.connect();
        };

        ws.onerror = err => {
            ws.close();
            this.state({load: true})
        }

    }
    
    componentDidMount() {
        if(window.innerWidth < 600) this.setState({mobile: true})
        else this.setState({mobile: false});
        this.setState({idChat: this.props.item})
        this.connect()
    }
    componentDidUpdate() {
        if((this.state.idChat !== this.props.item) && this.state.ws !== null) {
            this.setState({load: true})
            this.state.ws.close();
            this.setState({idChat: this.props.item});
            this.connect();
        }
    }
    componentWillUnmount() {
        if(this.state.ws !== null) {
            this.state.ws.close();
        }
    }
    changeMessage = (event) => {
        event.persist();
        const value = event.target.value
        this.setState({value: value});
    }
    send = (event) => {
        event.preventDefault();
        if(this.state.value !== "") {
            const data = JSON.stringify({
                text: this.state.value,
                attached: null
            });
            this.state.ws.send(data);
            this.setState({value: ""});
            let a = document.querySelector(".chatList");
            a.scrollTop = -1000;
        }
    }
    render() {
        return(
            <Paper elevation={0} sx={{justifySelf: 'center'}} className="chat-block">
                {this.state.load ? <Stack direction="column" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress color="primary" />
                </Stack> : 
                <Stack direction="column" justifyContent="space-between" alignItems="stretch" spacing={2} height="100%">
                    <Stack direction="row" justifyContent={this.state.mobile ? "space-between" : "flex-end"} alignItems="center" width="100%">
                        {this.state.mobile ? <Fab color="primary" size="small" children={<MenuIcon />} component={Link} to={"/home/chats"} /> : <></>}
                        <Fab variant="extended" color="secondary">
                            <Typography component={"h4"} variant={"p"} children={this.state.userData['nickname'][0]} mr={1} />
                            <Avatar alt={this.state.userData['nickname'][0]} 
                                src={this.state.userData["avatar"][0] === null ? "": `${document.location.origin}/avatar/${this.state.userData["avatar"][0]}`}/>
                        </Fab>
                    </Stack>
                   
                    <List sx={{height: "100%", overflowY: "auto"}} className="chatList">
                        {
                            this.state.messages.map((i) => {
                                return <this.MessageItem id={i.id} nickname={i.user["nickname"]} avatar={i.user["avatar"]} 
                                me={i.user["id"] === this.state.meId ? true : false} message={i.message} />
                            })
                        }
                    </List>
                    <form onSubmit={this.send} id={"send-message"}>
                        <TextField label="Сообщение" variant="outlined" multiline rows={3} value={this.state.value} fullWidth required color="primary" onChange={this.changeMessage}
                        InputProps={{endAdornment: <IconButton color="primary" type="submit" children={<SendIcon />} />}}/>
                    </form>
                </Stack> }
            </Paper>
        )
    }
}
