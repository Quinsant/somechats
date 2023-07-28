import { createTheme, ThemeProvider, Stack, SvgIcon } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Main from './Form';
import './index.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

class BG extends React.Component {
  render() {
    return(
      <Stack direction="column" justifyContent="flex-end" alignItems="center" spacing={0} width={"100vw"} height={"100vh"} className='bg-main'>
        <SvgIcon width="100%" id="background" viewBox="0 0 1440 590" class="transition duration-300 ease-in-out delay-150">
          <defs><linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="5%" stop-color="#90caf9"></stop><stop offset="95%" stop-color="#ce93d8"></stop></linearGradient></defs><path d="M 0,600 C 0,600 0,200 0,200 C 89.07177033492823,203.7224880382775 178.14354066985646,207.44497607655504 269,189 C 359.85645933014354,170.55502392344496 452.4976076555024,129.94258373205741 560,132 C 667.5023923444976,134.05741626794259 789.866028708134,178.7846889952153 900,179 C 1010.133971291866,179.2153110047847 1108.0382775119617,134.91866028708134 1196,131 C 1283.9617224880383,127.08133971291866 1361.9808612440193,163.54066985645932 1440,200 C 1440,200 1440,600 1440,600 Z" stroke="none" stroke-width="0" fill="url(#gradient)" fill-opacity="0.53" class="transition-all duration-300 ease-in-out delay-150 path-0"></path>
          <defs><linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="5%" stop-color="#90caf9"></stop><stop offset="95%" stop-color="#ce93d8"></stop></linearGradient></defs><path d="M 0,600 C 0,600 0,400 0,400 C 98.10526315789474,360.3062200956938 196.21052631578948,320.6124401913876 291,338 C 385.7894736842105,355.3875598086124 477.2631578947369,429.8564593301436 578,450 C 678.7368421052631,470.1435406698564 788.7368421052632,435.9617224880383 872,422 C 955.2631578947368,408.0382775119617 1011.7894736842104,414.29665071770336 1102,414 C 1192.2105263157896,413.70334928229664 1316.1052631578948,406.8516746411483 1440,400 C 1440,400 1440,600 1440,600 Z" stroke="none" stroke-width="0" fill="url(#gradient)" fill-opacity="1" class="transition-all duration-300 ease-in-out delay-150 path-1"></path>
        </SvgIcon>
      </Stack>
    )
  }
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <BG />
      <Main />
    </ThemeProvider>
  </React.StrictMode>
);
