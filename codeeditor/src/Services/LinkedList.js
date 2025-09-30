class Node {
    constructor(value = 0, next = null, prev = null,text = null) {
        this.value = value;
        this.next = next;
        this.prev = prev;
        this.text = text
    }
}

class LinkedList {
    constructor(head = null) {
        this.head = head;
        this.map = new Map();
        if(head != null)
            this.map[this.head.value] = head;
            this.tail = null;
    }

    insertLineAfter(prevLineId = null, newLineId,text = null) {
        if(this.head == null){
            this.head = new Node(newLineId);
            this.map[this.head.value] = this.head;
            this.head.text = text;
            return;
        }
        if(prevLineId == null){
            if(this.tail == null){
                let temp = this.head;
                while(temp.next != null){
                    temp = temp.next;
                }
                this.tail = temp;
                this.tail.text = text;
            }
            const newNode = new Node(newLineId);
            newNode.text = text;
            this.tail.next = newNode;
            newNode.prev = this.tail;
            this.tail = newNode;
            this.map[newLineId] = newNode;
            return;
        }
        const prevNode = this.map[prevLineId];
        const newNode = new Node(newLineId);
        newNode.text = text;
        // insert newNode after prevNode
        newNode.next = prevNode.next;
        newNode.prev = prevNode;

        if (prevNode.next) prevNode.next.prev = newNode;
        prevNode.next = newNode;
        this.map[newLineId] = newNode;
    }

    deleteLine(lineId) {
        const node = this.map[lineId];
        if (!node) return;

        if (node.prev) node.prev.next = node.next;
        if (node.next) node.next.prev = node.prev;

        delete this.map[lineId];
        delete this.map[lineId];
    }
    printText(){
        let temp = this.head;
        let arrayOrder =[]
        while(temp != null){
            arrayOrder.push(temp.value);
            temp = temp.next;
        }
        return arrayOrder;
    }
}

module.exports = {LinkedList,Node};
