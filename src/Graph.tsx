import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
  update: (data: any[]) => void,
}

class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as PerspectiveViewerElement;

    const schema = {
      price_abc: 'float',
      price_def: 'float',
      ratio: 'float',
      timestamp: 'date',
      upper_bound: 'float',
      lower_bound: 'float',
      trigger_alert: 'float',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      elem.setAttribute('row-pivots', '["timestamp"]');
      elem.setAttribute('columns', '["ratio", "upper_bound", "lower_bound", "trigger_alert"]');
      elem.setAttribute('aggregates', JSON.stringify({
        price_abc: 'avg',
        price_def: 'avg',
        ratio: 'avg',
        timestamp: 'distinct count',
        upper_bound: 'avg',
        lower_bound: 'avg',
        trigger_alert: 'avg',
      }));
    }
  }

  componentDidUpdate() {
    if (this.table) {
      this.table.update(
        this.props.data.map((el: ServerRespond) => {
          const priceABC = (el.top_ask && el.top_ask.price) || 0;
          const priceDEF = (el.top_bid && el.top_bid.price) || 0;
          const ratio = priceABC / priceDEF;
          const upperBound = 1.1;  // Example value, adjust as needed
          const lowerBound = 0.9;  // Example value, adjust as needed
          const triggerAlert = (ratio > upperBound || ratio < lowerBound) ? ratio : undefined;

          return {
            price_abc: priceABC,
            price_def: priceDEF,
            ratio,
            timestamp: new Date(el.timestamp),
            upper_bound: upperBound,
            lower_bound: lowerBound,
            trigger_alert: triggerAlert,
          };
        })
      );
    }
  }
}

export default Graph;
