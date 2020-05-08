import React from 'react';
import makeStyles from "@material-ui/core/styles/makeStyles";
import {ButtonProps, createStyles, darken} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import isEqual from "react-fast-compare";

const useStyles = makeStyles((theme) => {
    return createStyles({
        // style rule
        root: (props: IProps) => ({
            color: theme.palette.getContrastText(props.color),
            backgroundColor: props.color,
            '&:hover': {
                 backgroundColor: darken(props.color),
            },
        }),
    })
})

interface IProps extends Omit<ButtonProps, "color"> {
    readonly color: string;
}

// https://material-ui.com/styles/basics/#adapting-based-on-props
export const ColorButton = React.memo((props: IProps) => {
    // Pass the props as the first argument of useStyles()
    const classes = useStyles(props);

    return (
        <Button className={`${classes.root}`}>
            {props.children}
        </Button>
    );
}, isEqual);
