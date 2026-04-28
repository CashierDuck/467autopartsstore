

const url = 'http://blitz.cs.niu.edu/CreditCard/';

async function creditCardAuthorization(trans, cc, name, exp, amount) {
    const data = {
        vendor: 'Group 6A',
        trans: trans,
        cc: cc,
        name: name,
        exp: exp,
        amount: amount,
    };

    try {
        const response = await fetch (url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.text();
        console.log(result);

        return result;
    } 
    
    catch {
        console.error('Payment error:', error);
        throw error;
    }
}


