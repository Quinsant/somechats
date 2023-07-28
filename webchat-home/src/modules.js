import { styled } from '@mui/material/styles';
import {Alert, Badge, DialogTitle, IconButton, Snackbar, Tooltip} from "@mui/material";
import { Component, useState } from 'react';
import BadgeIcon from '@mui/icons-material/Badge';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';
import { passwordStrength } from 'check-password-strength';

export const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: '#44b700',
      color: '#44b700',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    },
  }));

export const StyledBadge2 = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        right: 0,
        top: 35,
        //padding: '0 10px',
    },
}));


export const BootstrapDialogTitle = (props) => {
  const { title, onClose, id, ...other } = props;
  const [btn, setBtn] = useState(false);
  function active() {
      if(btn) setBtn(false);
      else setBtn(true)
  }
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {btn ? (`@${id}`): title}
      <Tooltip title={
          btn ? "Скрыть id" : "Показать id"
      } children={
          <IconButton aria-label="id" sx={{position: 'absolute', right: 50, top: 8}} children={
              <BadgeIcon color="primary" />} onClick={active} />} />
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

export function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
          <>{children}</>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function check_password(password) {
  switch (passwordStrength(password).value) {
      case "Too weak":
          return {code: true, textPassword: "Новый пароль (простой)"}
      case ("Weak" || "Medium" || "Strong"):
          return {code: false, textPassword: "Новый пароль"}
      default:break;
  }
}

export class SnackBarAlert extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      text: "",
      icon: undefined,
      type: "info",
    }
  }
  componentDidMount() {
    this.setState({open: this.props.open, text: this.props.text, icon: this.props.icon, type: this.props.type});
  }
  close = () => this.setState({open: false, text: "", icon: undefined});
  
  render() {
    return(
      <Snackbar open={this.state.open} autoHideDuration={6000} onClose={this.close} children={
        <Alert severity={this.state.type} icon={this.state.icon === undefined ? <></> : this.state.icon} children={this.state.text} 
      />} />
    )
  }
}