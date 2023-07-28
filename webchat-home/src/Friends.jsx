import { AppBar, Avatar, ButtonGroup, Chip, Fab, IconButton, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Paper, Stack, TextField, Toolbar, Tooltip, Typography } from "@mui/material";
import React from "react";
import SendIcon from '@mui/icons-material/Send';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import axios from "axios";
import { Link } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';

export default class Friends extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: undefined,
            mobile: false,
            eventSource: new EventSource("/home/friends/data"),
        }
    }

    componentDidMount() {
        if(window.innerWidth < 600) this.setState({mobile: true})
        else this.setState({mobile: false});
        this.state.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            //console.log(data);
            if(data.length !== 0) this.setState({data: data});
            else this.setState({data: undefined});
        }
    }
    componentWillUnmount() {
        this.state.eventSource.close();
    }

    render() {
        const state = this.state;
        return(<Stack direction="column" justifyContent="center" alignItems="center" spacing={3}>
            {this.state.mobile ? <Stack direction="row" justifyContent="flex-start" alignItems="center" width="100%" 
            children={<Fab color="primary" size="small" children={<MenuIcon />} component={Link} to={"/home"} />} /> : <></>}
            
            <List width={"100%"} >{
                state.data === undefined ? <Typography color={"secondary"} children={"Ничего не найдено!"} variant="p" /> : 
                <Stack direction={this.state.mobile ? "column" : "row"} justifyContent="flex-start" alignItems="center" spacing={2}>
                    {
                        state.data.map((i) => {
                            return <Friend id={i.id} nickname={i.nickname} login={i.login} online={i.online} avatar={i.avatar} />
                        })
                    }
                </Stack>
            }</List>
        </Stack>);
    }
}




function Friend(props) {
    const id = props.id;

    const rmFriend = () => {
        axios({method: 'POST', url: `${document.location.href}/rmfriend`, data: {id: id}, headers: {'Content-Type': 'application/json'}});
    }
    const newChat = () => {
        axios({method: 'POST', url: `${document.location.origin}/home/chats/new`, data: {id: id}, headers: {'Content-Type': 'application/json'}})
        .then((response) => {
            if(response.data.success) {
                let id = response.data.id;
                document.location = document.location.origin + "/home/chats/"+id;
            }

        }).catch(() => {console.error("Request failed!")});
    }

    return(
        <Paper elevation={5}><ListItem>
            <ListItemAvatar children={<Avatar sx={{width: "2.5em", height: "2.5em"}} 
            src={props.avatar === null ? "": `${document.location.origin}/avatar/${props.avatar}`}/>} />

            <ListItemText color="primary" primary={`${props.nickname}`} sx={{ml: 1}} secondary={<React.Fragment>
                <Stack direction="row" justifyContent="flex-start" alignItems="center" spacing={.5} mt={.5}>
                    <Chip color="secondary" label={`@${props.login}`} variant="outlined" size="small"  />
                    {
                        props.online ? <Chip color="success" label={"Online"} variant="outlined" size="small" /> : <></>
                    }
                </Stack>
            </React.Fragment>}  />

            <ButtonGroup variant="text" sx={{ml: 1.5}}  disableElevation >
                <Tooltip title="Удалить из друзей" children={<IconButton onClick={rmFriend} children={<PersonOffIcon color="error" />} />}/>
                <Tooltip title="Написать"  children={<IconButton onClick={newChat} children={<SendIcon color="primary" />}  />}/>
            </ButtonGroup>
        </ListItem></Paper>
    )
}