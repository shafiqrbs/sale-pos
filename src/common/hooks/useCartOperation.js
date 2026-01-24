export default function useCartOperation() {

    const increment = (id) => {
        console.log("increment", id)
    }

    const decrement = (id) => {
        console.log("decrement", id)
    }

    const remove = (id) => {
        console.log("remove", id)
    }

    const clear = () => {
        console.log("clear")
    }


    const getCart = () => {
        console.log("getCart")
    }

    const getCartTotal = () => {
        console.log("getCartTotal")
    }

    const getCartTotalQuantity = () => {
        console.log("getCartTotalQuantity")
    }

    const getCartTotalPrice = () => {
        console.log("getCartTotalPrice")
    }

    return { increment, decrement, remove, clear, getCart, getCartTotal, getCartTotalQuantity, getCartTotalPrice }
}
