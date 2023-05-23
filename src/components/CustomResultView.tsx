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
                <a onClick={onClickLink} href={result.url?.raw} target='_blank' dangerouslySetInnerHTML={{__html: result.title?.snippet}}/>
            </h3>
            {
                result.thumbnail_url?.raw &&
                <span className="sui-result__image">
                    <a href={result.thumbnail_url?.raw} target='_blank' >
                        <img src={result.thumbnail_url?.raw} alt="" style={{height: "100px"}} />
                    </a>
                </span>
            }
        </div>
        <div className="sui-result__body">
            {/* use 'raw' values of fields to access values without snippets */}

            {/* Use the 'snippet' property of fields with dangerouslySetInnerHtml to render snippets */}
            <ul className="sui-result__details">
                {
                    result.subtitle &&
                    <li>
                        {/*<span className="sui-result__key">keywords</span>*/}
                        <span className="sui-result__value"><b>{result.subtitle?.raw}</b></span>
                    </li>
                }
                <li>
                    <span className="sui-result__key">category</span>
                    <span className="sui-result__value">{result.category?.raw}</span>
                </li>
                {
                    result.sub_category?.raw &&
                    <li>
                        <span className="sui-result__key">sub-category</span>
                        <span className="sui-result__value">{result.sub_category?.raw}</span>
                    </li>
                }
                <li>
                    {/*<span className="sui-result__key">short description</span>*/}
                    <span className="sui-result__value" dangerouslySetInnerHTML={{__html: result.meta_description?.raw}}/>
                </li>
                {
                    result.body_content?.snippet && result.body_content?.snippet.includes("<em>") &&
                    <li>
                        <span className="sui-result__key">snippet</span>
                        <span className="sui-result__value" dangerouslySetInnerHTML={{__html: result.body_content?.snippet}}/>
                    </li>
                }
                {
                    result.traits?.raw && Object.values(result.traits?.raw).length > 0 &&
                    <li>
                        <span className="sui-result__key">traits</span>
                        <span className="sui-result__value">{Object.values(result.traits?.raw).join(", ")}</span>
                    </li>
                }
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