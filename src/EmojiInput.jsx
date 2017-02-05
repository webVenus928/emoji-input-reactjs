import React, { Component, PropTypes } from 'react';
import getCaretCoordinates from 'textarea-caret';

import emojiKeywords from 'emojis-keywords';
import emojiList from 'emojis-list';
import Suggestions from './Suggestions';

const emojis = emojiKeywords.map((keyword, index) => {
  return {
    keyword: emojiKeywords[index],
    character: emojiList[index],
  };
});

// Keycodes
const TAB = 9;
const ENTER = 13;
const ESCAPE = 27;
const UP = 38;
const DOWN = 40;

const SUGGESTIONS_TOP_OFFSET = 20;
const SUGGESTIONS_LIMIT = 5;

const initialState = {
  leftIndex: -1,
  caretPosition: -1,
  showSuggestions: false,
  fragment: null,
  suggestionsPosition: {
    top: 0,
    left: 0,
  },
};

class EmojiInput extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
    this.resetState = this.resetState.bind(this);
  }

  resetState() {
    this.setState(initialState);
  }

  render() {
    let suggestions = [];
    if (this.state.showSuggestions && this.state.fragment) {
      const matches = [];
      emojis.forEach((emoji) => {
        const matchingIndex = emoji.keyword.indexOf(this.state.fragment);
        if (matchingIndex !== -1) {
          matches.push(Object.assign({}, emoji, {
            index: matchingIndex,
          }));
        }
      });
      matches.sort((a, b) => {
        return a.index - b.index;
      });
      suggestions = matches.slice(0, SUGGESTIONS_LIMIT).map((match) => {
        return {
          value: match.character,
          keyword: match.keyword,
          label: (<span>{match.character} &nbsp; {match.keyword}</span>),
        };
      });
    }

    const TextComponent = this.props.input ? 'input' : 'textarea';

    return (
      <div className={`ei-container ${this.props.className || ''}`}>
        <TextComponent
          className="ei-text-component"
          rows={this.props.rows}
          ref={(textComponent) => { this.textComponent = textComponent; }}
          defaultValue={this.props.defaultValue}
          onClick={this.resetState}
          onKeyDown={(event) => {
            switch (event.keyCode) {
              case UP:
              case DOWN:
                if (this.suggestions) {
                  this.suggestions.traverseSuggestions(event.keyCode === DOWN);
                  event.preventDefault();
                }
                return;
              case TAB:
              case ENTER:
                if (this.suggestions) {
                  this.suggestions.selectSuggestion();
                  event.preventDefault();
                }
                return;
              case ESCAPE:
                this.resetState();
                break;
              default:
                break;
            }
          }}
          onInput={() => {
            const textComponent = this.textComponent;

            const caretPosition = textComponent.selectionStart;
            let leftIndex = caretPosition;
            // Find left word boundary containing the caret.
            const value = textComponent.value;
            while (leftIndex > 0) {
              leftIndex -= 1;
              if (/\s/.test(value[leftIndex])) {
                leftIndex += 1;
                break;
              }
            }
            // Extract word.
            const fragment = value.substring(leftIndex, caretPosition);

            const newState = {
              leftIndex,
              caretPosition,
              showSuggestions: false,
            };
            if (fragment.length > 1 && fragment[0] === ':') {
              newState.showSuggestions = true;
              newState.fragment = fragment.substring(1);
            }

            if (!this.state.showSuggestions && newState.showSuggestions) {
              const { top, left } = getCaretCoordinates(textComponent, textComponent.selectionEnd);
              newState.suggestionsPosition = {
                top: top + SUGGESTIONS_TOP_OFFSET,
                left,
              };
            }
            this.setState(newState);
          }}
        />
        {this.state.showSuggestions && suggestions.length > 0 &&
          <Suggestions
            style={this.state.suggestionsPosition}
            ref={(sug) => { this.suggestions = sug; }}
            options={suggestions}
            onSelect={(option) => {
              const text = this.textComponent.value;
              let value = option.value;
              if (this.props.shortname) {
                value = option.keyword;
              }

              const beforeFragment = text.substring(0, this.state.leftIndex);
              const afterFragment = text.substring(this.state.caretPosition, text.length);
              const newText = `${beforeFragment}${value} ${afterFragment}`;
              this.textComponent.value = newText;

              // In case the focus was lost due to a click of the suggestions.
              this.textComponent.focus();

              // Set caret to after the replaced fragment.
              const newCaretPosition = this.state.leftIndex + value.length + 1;
              this.textComponent.setSelectionRange(newCaretPosition, newCaretPosition);
              this.resetState();
            }}
          />
        }
      </div>
    );
  }
}

EmojiInput.propTypes = {
  className: PropTypes.string,
  defaultValue: PropTypes.string,
  input: PropTypes.bool,
  rows: PropTypes.number,
  shortname: PropTypes.bool,
};

EmojiInput.defaultProps = {
  className: '',
  defaultValue: '',
  input: false,
  rows: 10,
  shortname: false,
};

export default EmojiInput;
