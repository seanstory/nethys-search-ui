import {SearchResult} from "@elastic/search-ui";

export const CustomResultView = ({
                              result,
                              onClickLink
                          }: {
    result: SearchResult;
    onClickLink: () => void;
}) => (
    <li className="sui-result">
        <div className="sui-result__header">
            <h3>
                {/* Maintain onClickLink to correct track click throughs for analytics*/}
                <a onClick={onClickLink} href={result.url?.raw} dangerouslySetInnerHTML={{__html: result.title?.snippet}}/>
            </h3>
            {
                result.thumbnail_url?.raw &&
                <span className="sui-result__image">
                    <img src={result.thumbnail_url?.raw} alt="" style={{height: "100px"}} />
                </span>
            }
        </div>
        <div className="sui-result__body">
            {/* use 'raw' values of fields to access values without snippets */}

            {/* Use the 'snippet' property of fields with dangerouslySetInnerHtml to render snippets */}
            <ul className="sui-result__details">
                <li>
                    <span className="sui-result__key">category</span>
                    <span className="sui-result__value">{result.category?.raw}</span>
                </li>
                <li>
                    <span className="sui-result__key">sub-category</span>
                    <span className="sui-result__value">{result.sub_category?.raw}</span>
                </li>
                <li>
                    <span className="sui-result__key">short description</span>
                    <span className="sui-result__value" dangerouslySetInnerHTML={{__html: result.meta_description?.raw}}/>
                </li>
                <li>
                    <span className="sui-result__key">main content</span>
                    <span className="sui-result__value" dangerouslySetInnerHTML={{__html: result.body_content?.snippet}}/>
                </li>
                {
                    result.meta_keywords &&
                    <li>
                        <span className="sui-result__key">keywords</span>
                        <span className="sui-result__value">{Object.values(result.meta_keywords?.raw).join(", ")}</span>
                    </li>
                }
            </ul>
        </div>
    </li>
);
export {}