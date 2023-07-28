import React from "react";
import { Box, Grid, Paper, Tab, Tabs, Stack, Typography, Divider, Container} from '@mui/material';
import PropTypes from 'prop-types';
import Login from "./Login";
import Registration from "./Registration";

function InfoForm() {
  return(
    <Stack direction="column" maxWidth={"400px"} justifyContent="center" alignItems="center" spacing={1} divider={<Divider orientation="horizontal" flexItem />}>
      <Stack direction="row" justifyContent="center" alignItems="center" spacing={3}>
        <img src={`${document.location.origin}/static/icon.svg`} alt="logo" width={"64px"} height={"64px"}/>
        <Typography variant="h4" component={"h1"} children={"Some Chats"} fontWeight={"bold"} m={0} translate={"no"} /> 
      </Stack>
      <Typography component={"p"} variant={"body2"} textAlign={"center"} 
        children={"Приватный веб-чат с возможностью поиска товарищей и общения с ними без каких-либо ограничений"} />
    </Stack>
  )
}


export default class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 0,
        }
    }

    TabPanel(parameters) {
        const { children, value, index, ...other } = parameters;

        return (
          <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
          >
            {value === index && (
              <Box sx={{p:3}}>{children}</Box>
            )}
          </div>
        );
    }

    a11yProps(index) {
        return {
          id: `simple-tab-${index}`,
          'aria-controls': `simple-tabpanel-${index}`,
        };
      }

    handleChange = (event, newValue) => {
        this.setState({value: newValue})
    }
    render() {
      this.TabPanel.propTypes = {
        children: PropTypes.node,
        index: PropTypes.number.isRequired,
        value: PropTypes.number.isRequired,
      };
      return(
        <Container maxWidth="sm" className="main-form-container" >
          <Paper elevation={24} className='main-form'>
            <Stack direction="column" justifyContent="center" alignItems="center" spacing={3} height={"100%"} sx={{bgcolor: "#151515"}} className="form-resize">
              <InfoForm />
              <Stack direction="column" minWidth={"80%"} justifyContent="center" alignItems="center" spacing={1}>
                <Grid container direction="column" justifyContent="center" alignItems="center">
                  <Tabs value={this.state.value} onChange={this.handleChange} className="tab" indicatorColor="secondary">
                    <Tab label="Войти" {...this.a11yProps(0)} sx={{color: "white"}} />
                    <Tab label="Зарегистрировать" {...this.a11yProps(1)} sx={{color: "white"}}/>
                  </Tabs>
                </Grid>
                <Grid container direction="column" justifyContent="center" alignItems="stretch">
                  <this.TabPanel value={this.state.value} index={0}><Login /></this.TabPanel>
                  <this.TabPanel value={this.state.value} index={1}><Registration /></this.TabPanel>
                </Grid>
            </Stack>
            </Stack>
          </Paper>
        </Container>
      )
    }
}



// return (


//     <Paper elevation={24} className='main-form'>

//     </Paper>
//   </Stack>
// )