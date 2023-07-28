import { Alert, CircularProgress, createTheme, Snackbar, Stack, ThemeProvider } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import cookie from 'cookie_js';
import MainMenu from './MainMenu';
import { BrowserRouter } from 'react-router-dom';

export const URL_SET = `${document.location.origin}/home/set`;

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: "",
      primary: "",
      secondary: "",
      header: null,
      error: false,
      online: false,
    }
  }

  componentDidMount() { 
    let eventSource = new EventSource("/home/userdata");
    eventSource.onmessage = (event) => {
      this.setState({error: false});
      const data = JSON.parse(event.data);
      const theme = data.theme;
      cookie.set("theme", JSON.stringify(theme));
      this.setState({mode: theme.mode, primary: theme.primary, secondary: theme.secondary, header: data, online: data.online});
    }
    eventSource.onerror = () => this.setState({error: true, online: false});
  }


  render() {
    let state = this.state;
    if(state.header !== null) {
      const theme =  createTheme({
        palette: {
          mode: state.mode,
          primary: {main: state.primary},
          secondary: {main: state.secondary},
        },
      })
      // let data = {
      //   avatar: null,
      //   login: null,
      //   nickname: null,
      //   theme: {
      //     primary: "#fff",
      //     secondary: "#fff"
      //   }
      // }
      return(
        <ThemeProvider theme={theme}> 
          <BrowserRouter>
            <MainMenu data={state.header} online={state.online} />
            {
              state.error ? <Snackbar open={state.error} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}} children={
                <Alert severity='error' children={"Ошибка подключения к серверу!"} 
              />} />: <></>
            }
          </BrowserRouter>
        </ThemeProvider>
      )
    }
    else {
      const theme =  createTheme({palette: {mode: "dark"}});
      
      return ( <ThemeProvider theme={theme}>
        <Stack direction="column" justifyContent="center" alignItems="center" height={"100vh"} bgcolor={"#121212"}>
          <CircularProgress sx={{color: "#5C8FF9"}} size={65}/>
          {
            state.error ? <Snackbar open={state.error} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}} children={
              <Alert severity='error' children={"Ошибка подключения к серверу!"} 
            />} />: <></>
          }
        </Stack>
      </ThemeProvider>)
    }
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Main />);
