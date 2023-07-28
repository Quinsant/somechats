import { Avatar, Stack, ButtonGroup, IconButton, ListItem, ListItemAvatar, Divider, ListItemText, Menu, List, Tooltip, Typography, AppBar, Toolbar, MenuItem, ListItemIcon } from "@mui/material";
import React from "react";
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import RemoveIcon from '@mui/icons-material/Remove';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckIcon from '@mui/icons-material/Check';
import axios from "axios";
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from "react-router-dom";

function NoticeData(props) {
    const data = props.data;

    const addFriend = () => {
        const res = {id: data.user.id, answer: true};
        axios({method: 'POST', url: `${document.location.href}/addfriend`, data: res, headers: {'Content-Type': 'application/json'}})
    }

    const rejectFriend = () => {
        const res = {id: data.user.id, answer: false}
        axios({method: 'POST', url: `${document.location.href}/addfriend`, data: res, headers: {'Content-Type': 'application/json'}})
    }

    const rmNotice = () => {
        const res = {id: data.id}
        axios({method: 'POST', url: `${document.location.href}/rmnotice`, data: res, headers: {'Content-Type': 'application/json'}})
    }

    let type = data.type;
    switch (type.key) {
        case "friend":
            return (<>
                <ListItem alignItems="center">
                    <ListItemAvatar>
                        {
                            data.user.avatar === null ? <Avatar children={<PersonAddAlt1Icon />} /> :
                            <Avatar src={`${document.location.origin}/avatar/${data.user.avatar}`} />
                        }
                    </ListItemAvatar>
                    <ListItemText primary={
                        <Typography sx={{ display: 'inline' }} component="span" color="primary" 
                            variant="body1" children="Заявка в друзья" fontWeight="bold" />} secondary={
                        <React.Fragment>
                            <Typography sx={{ display: 'inline' }} component="span" color="secondary" variant="body2" children={`${data.user.nickname}`} />
                                {` — отправил приглашение в друзья`}

                        </React.Fragment>} color="primary" />
                    <ButtonGroup variant="text" sx={{ml: .5}}  disableElevation >
                        <Tooltip title="Принять" onClick={addFriend} children={<IconButton children={<DoneIcon color="primary"/>}/>}/>
                        <Tooltip title="Отклонить" onClick={rejectFriend} children={<IconButton children={<CloseIcon color="secondary"/>}/>}/>
                    </ButtonGroup>
                
                </ListItem>
                <Divider variant="inset" component="li" />
            </>)
        case "friendAnswer":
            return (<>
                <ListItem alignItems="center">
                    <ListItemAvatar>
                        {
                            data.user.avatar === null ? <Avatar children={type.answer ? <ThumbUpIcon /> : <ThumbDownIcon />} /> :
                            <Avatar src={`${document.location.origin}/avatar/${data.user.avatar}`} />
                        }
                    </ListItemAvatar>
                    <ListItemText primary={
                        <Typography sx={{ display: 'inline' }} component="span" color="primary" 
                            variant="body1" children="Заявка в друзья" fontWeight="bold" />} secondary={
                        <React.Fragment>
                            <Typography sx={{ display: 'inline' }} component="span" color="secondary" variant="body2" children={`${data.user.nickname}`} />
                                {type.answer ? ` — принял ваше приглашение в друзья` : ` — отклонил ваше приглашение в друзья`}

                        </React.Fragment>} color="primary" />

                    <Tooltip title="Удалить" onClick={rmNotice} children={<IconButton children={<RemoveIcon color="error"/>}/>}/>

                </ListItem>
                <Divider variant="inset" component="li" />
            </>)
        default:
            break;
    }
    
}



export default class Notice extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menu: false,
            filter: "all",
            all: null,
            friend: Array(),
            rooms: Array(),
            answer: Array(),
            mobile: false,
            eventSource: new EventSource("/home/notices/data")
        }
    }
    componentDidMount() {
        if(window.innerWidth < 600) this.setState({mobile: true})
        else this.setState({mobile: false});
        this.state.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if(data.length !== 0) {
                //console.log(data);
                let friends = Array();
                let room = Array();
                let answer = Array();
                data.map((i) => {
                    switch (i.type.key) {
                        case "friend":
                            friends.push(i);
                            break;
                        case "room":
                            room.push(i);
                            break;
                        case "friendAnswer":
                            answer.push(i);
                            break; 
                        default:
                            break;
                    }
                });
                this.setState({all: data, friend: friends, rooms: room, answer: answer});
            }
            else this.setState({all: null, friend: [], rooms: [], answer: []});
        }
    }
    componentWillUnmount() {
        this.state.eventSource.close();
    }
    handleChangeFilter = (newValue) => {
        this.setState({filter: newValue})
        this.handleCloseFilter();
    };


    handleOpenFilter = (event) => this.setState({menu: event.currentTarget});
    handleCloseFilter = () => this.setState({menu: null})
    
    render() {
        const state = this.state;
        return (
            <Stack direction="column" justifyContent="center" alignItems="center" spacing={3}>
                <AppBar position="static" sx={{borderRadius: 15}} color={"inherit"} >
                    <Toolbar>
                        <Stack direction="row" justifyContent={state.mobile ? "space-between" : "flex-end"} alignItems="center" sx={{width: '100%'}}>
                        {state.mobile ? <IconButton hidden={!state.mobile} component={Link} to={"/home"} children={<MenuIcon />} /> : <></>}
                            <Tooltip title={"Фильтр"}><IconButton id="filter-button" onClick={this.handleOpenFilter} 
                            children={<FilterAltIcon color="primary" /> } aria-haspopup="true" 
                                aria-controls={Boolean(state.menu) ? 'filter-menu' : undefined} 
                                aria-expanded={Boolean(state.menu) ? 'true' : undefined} /></Tooltip>
                                
                            <Menu MenuListProps={{'aria-labelledby': 'filter-button'}} open={Boolean(state.menu)} 
                                anchorEl={state.menu} onClose={this.handleCloseFilter} id={"filter-menu"}>

                                <MenuItem onClick={() => this.handleChangeFilter("all")}>
                                    <ListItemIcon>{state.filter === "all" ? <CheckIcon color="secondary" /> : <></>}</ListItemIcon>
                                    <ListItemText>Все</ListItemText>
                                </MenuItem>
                                {
                                    state.friend.length === 0 ? <></> : <MenuItem onClick={() => this.handleChangeFilter("friend")}>
                                        <ListItemIcon>{state.filter === "friend" ? <CheckIcon color="secondary" /> : <></>}</ListItemIcon>
                                        <ListItemText>Запросы в друзья</ListItemText>
                                    </MenuItem>
                                }
                                {
                                    state.rooms.length === 0 ? <></> : <MenuItem onClick={() => this.handleChangeFilter("rooms")}>
                                        <ListItemIcon>{state.filter === "room" ? <CheckIcon color="secondary" /> : <></>}</ListItemIcon>
                                        <ListItemText>Запросы в комнаты</ListItemText>
                                    </MenuItem>
                                }
                                {
                                    state.answer.length === 0 ? <></> : <MenuItem onClick={() => this.handleChangeFilter("answer")}>
                                        <ListItemIcon>{state.filter === "answer" ? <CheckIcon color="secondary" /> : <></>}</ListItemIcon>
                                        <ListItemText>Ответы на запросы</ListItemText>
                                    </MenuItem>
                                }
                            </Menu>
                        </Stack>
                        
                    </Toolbar>
                </AppBar>
                {
                    state.all === null ? <Typography color={"secondary"} children={"Ничего не найдено!"} variant="p" /> : 
                    <List className="noticeMenu">{
                        state.filter === "all" ? state.all.map((i) => {return <NoticeData data={i} />})  :
                            state[state.filter].map((i) => {
                                return <NoticeData data={i} />;
                            }) 
                    }</List>}
            </Stack>
        )
    }
}

{/* <List className="noticeMenu">
            <ListItem alignItems="center">
                <ListItemAvatar><Avatar><GroupAddIcon  /></Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={
                        <Typography sx={{ display: 'inline' }} component="span" color="primary" 
                            variant="body1" children="Заявка в комнату" fontWeight="bold" />} secondary={
                            <React.Fragment>
                                    <Typography sx={{ display: 'inline' }} component="span" color="secondary" variant="body2" children={"Чdlfddlf dfldfl"} />
                                    {` — отправил приглашение в комнату "вавава"`}
                                </React.Fragment>
                              } color="primary" />
                            <ButtonGroup variant="text" sx={{ml: .5}} disableElevation >
                                <Tooltip title="Принять" children={<IconButton children={<DoneIcon color="primary"/>}/>}/>
                                <Tooltip title="Отказаться" children={<IconButton children={<CloseIcon color="secondary"/>}/>}/>
                            </ButtonGroup>
                        </ListItem>
                        <Divider variant="inset" component="li" />
                        <ListItem alignItems="center">
                            <ListItemAvatar>
                                <Avatar>
                                    <PersonAddAlt1Icon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={
                                <Typography sx={{ display: 'inline' }} component="span" color="primary" 
                                variant="body1" children="Заявка в друзья" fontWeight="bold" />} secondary={
                                <React.Fragment>
                                    <Typography sx={{ display: 'inline' }} component="span" color="secondary" variant="body2" children={"Чdlfddlf dfldfl"} />
                                    {` — отправил приглашение в друзья`}
                                </React.Fragment>
                              } color="primary" />
                            <ButtonGroup variant="text" sx={{ml: .5}}  disableElevation >
                                <Tooltip title="Принять" children={<IconButton children={<DoneIcon color="primary"/>}/>}/>
                                <Tooltip title="Отказаться" children={<IconButton children={<CloseIcon color="secondary"/>}/>}/>
                            </ButtonGroup>
                        </ListItem>
                        <Divider variant="inset" component="li" />
                   
             </List> */}