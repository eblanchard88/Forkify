// GLOBAL APP CONTROLLER
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';


// GLOBAL STATE OF THE APP //
// Search object          (search controller)
// current recipe object  (recipe controller)
// shopping list object   (list controller)
// liked recipes          (like controller)
const state = {};

//~~~~~~ SEARCH CONTROLLER ~~~~~~//
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
const controlSearch = async () => {
    // capture input
    const query = searchView.getInput();

    if(query) {
        // new seach object and add it to state
        state.search = new Search(query);
        // prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
        // search for recipes
        await state.search.getResults();
        // render results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        } catch (err) {
            alert('something went wrong');
            clearLoader();
        }

    }

}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

//~~~~~RECIPE CONTROLLER ~~~~~~//
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
const controlRecipe = async () => {
    // get id from URL
    const id = window.location.hash.replace('#', '');

    if(id) {
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        // highlight selected search item
        if (state.search) searchView.highlightSelected(id);
        // create recipe object
        state.recipe = new Recipe(id);

        try {
        // get recipe data and parse ingredients
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();
        // calculate servings and time
        state.recipe.calcTime();
        state.recipe.calcServings();
        // render the recipe
        clearLoader();
        recipeView.renderRecipe(
            state.recipe, 
            state.likes.isLiked(id));
        } catch (err) {
            console.log(err);
            alert('Error processing recipe!');
        }


    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));



/** ~~~~~~~ LIST CONTROLLER ~~~~~~~~~~~~*/
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
const controlList = () => {
    // create a new list IF there is no list yet
    if (!state.list) state.list = new List();
    // add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
};

const listAddSingle = () => {
    // get input from add ingredient field
    // clear input field
    // add item to shopping list array
    //TODO.addItem(el.count, el.unit, el.ingredient);
    // render item list to UI
};

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete item from state
        state.list.deleteListItem(id);
        // delete item from UI
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value);
        state.list.updateCount(id, val);
    }
});

 
//~~~~~ LIKE CONTROLLER ~~~~~~~~~~~~//
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();

    const currentID = state.recipe.id;

    if (!state.likes.isLiked(currentID)) {
        // add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // toggle like button
        likesView.toggleLikeBtn(true);
        // add like to UI list
        likesView.renderLike(newLike);

    } else {
        // remove like from state
        state.likes.deleteLike(currentID);
        // toggle like button
        likesView.toggleLikeBtn(false);
        // remove like from UI list
        likesView.deleteLike(currentID);
    }
    
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};


// restore liked recipes upon page LOAD ~~~~~~~~~~~~~//
window.addEventListener('load', () => {
    state.likes = new Likes();
    // restore likes from localStorage
    state.likes.readStorage();
    // toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    // render likes in menu
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// handling the recipe UI button clicks ~~~~~~~~~~//
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // DEC if decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // INC if increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn-add, .recipe__btn-add *')) {
        // ADD ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // clicked LIKE button
        controlLike();
    }
});