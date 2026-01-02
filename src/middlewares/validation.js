



export const validation = (schema) => {
    return (req, res, next) => {
        let validationError = [];
        for (const key of Object.keys(schema)) {
            const data = schema[key].validate(req[key], { abortEarly: false });
            if(data?.error){
                validationError.push(data?.error?.details);
        }
    }
        if (validationError.length) {
            return res.status(400).json({ message: "Validation error", error: validationError });
    }
        next();
    
}

}